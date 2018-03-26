import _ from 'lodash';
import axios from 'axios';

import Paths from 'B.Net/Paths';
import retrieveSpec from 'B.Net/retrieveSpec';
import { getBearerToken } from 'B.Net/auth';

// --------------------------------------
const Service = axios.create({
  baseURL: Paths.API,
  headers: {
    'X-Api-Key': process.env.BNET_API_KEY,
  },
  withCredentials: true,
});

// --------------------------------------
let ready = false;
let specPromise = null;
const errorHandlers = [];

const ServiceHelper = Object.create(Service);

Object.defineProperty(ServiceHelper, 'ready', {
  configurable: false,
  enumerable: false,
  async get() {
    if (ready) {
      return true;
    }

    specPromise = retrieveSpec();
    let spec = null;
    try {
      spec = await specPromise;
    } catch (e) {
      return false;
    }

    Service.defaults.baseURL = (function transformUrl(url) {
      const newURL = new URL(url);
      if (!newURL.hostname.startsWith('www.')) {
        newURL.hostname = `www.${newURL.hostname}`;
      }

      if (newURL.protocol === 'http:') {
        newURL.protocol = 'https:';
      }

      return newURL.toString();
    }(spec.servers[0].url));

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed(`Initialized service: ${Service.defaults.baseURL}`);
      console.log(spec);
      console.groupEnd(`Initialized service: ${Service.defaults.baseURL}`);
    }

    ready = true;
    return true;
  },
});

// --------------------------------------
Service.interceptors.request.use(async (config) => {
  const { specPath, operationId } = config;
  if (specPath || operationId) {
    const spec = await specPromise;
    const verb = config.method.toLowerCase() || 'get';
    const path = (function resolveOperationId(id) {
      if (id) {
        const operation = _.findKey(spec.paths, { [verb]: { operationId } });
        return operation;
      }

      return specPath;
    }(operationId));

    if (!path && operationId) {
      const error = new Error(`Operation ${operationId} not found / [${verb}] not supported`);
      return Promise.reject(error);
    }

    const endpoint = spec.paths[path][verb];

    // Path parameters
    const parameters = endpoint.parameters.filter(param => param.in === 'path');
    const parameterNames = parameters.map(({ name }) => name);

    const { operationParams = {} } = config;
    const missingParams = _.difference(parameterNames, Object.keys(operationParams));
    if (missingParams.length > 0) {
      const missing = parameters
        .filter(({ name, required }) => required && missingParams.includes(name))
        .map(({ name, description }) => `${name} (${description})`)
        .join(', ');

      return Promise.reject(new Error(`Missing path parameters: ${missing}`));
    }

    const paramsRE = new RegExp(`{(${parameterNames.join('|')})}`, 'gi');
    // eslint-disable-next-line no-param-reassign
    config.url = path.replace(paramsRE, matched => operationParams[matched.slice(1, -1)]);

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed(`Request: ${config.url}`);
      console.log(endpoint);
      console.groupEnd(`Request: ${config.url}`);
    }

    // Query parameters
    const operationQueries = endpoint.parameters.filter(param => param.in === 'query');
    const queries = {};
    operationQueries.forEach(({ name }) => { queries[name] = operationParams[name]; });
    // eslint-disable-next-line no-param-reassign
    config.params = Object.assign({}, config.params, queries);

    // Temp fix until axios pushes an update that fixes the baseURL not being added.
    // TODO: Remove this when axios updates.
    // eslint-disable-next-line no-param-reassign
    config.url = `${config.baseURL}${config.url}`;

    let addSecurity = Boolean(endpoint.security);
    if (!addSecurity && _.find(operationQueries, { name: 'components' })) {
      const components = _.get(queries, 'components', '');
      try {
        // eslint-disable-next-line no-bitwise
        addSecurity |= String(components)
          .split(',')
          .some(component => [102, 103, 201, 202, 204].includes(Number(component)));
      } catch (e) {
        console.warn('Invalid components passed.');
      }
    }

    if (addSecurity) {
      // eslint-disable-next-line no-param-reassign
      config.headers.Authorization = await getBearerToken();
    }
  }

  return Promise.resolve(config);
});

Service.interceptors.response.use(({
  status,
  statusText,
  data,
  config,
}) => {
  if (process.env.NODE_ENV !== 'production') {
    console.groupCollapsed(config.url);
    console.log(data, config);
    console.groupEnd(config.url);
  }

  if (status !== 200) {
    return Promise.reject(new Error(statusText));
  }

  if (Number(data.ErrorCode) === 1) {
    return Promise.resolve(data.Response);
  }

  const error = new Error(data.Message);
  const { ErrorCode: code, ErrorStatus: bungieStatus, Message: message } = data;

  error.name = bungieStatus;
  error.code = code;

  const { handle } = errorHandlers.find(({ codes }) => codes.includes(Number(code))) || {};
  if (typeof handle === 'function') {
    return Promise.resolve(handle({ code, status, message }));
  }

  return Promise.reject(new Error(message));
}, error => Promise.reject(error));

// --------------------------------------
ServiceHelper.addErrorHandler = function addErrorHandler(codes, handle) {
  if (!Array.isArray(codes)) {
    errorHandlers.push({ codes: [codes], handle });
  } else {
    errorHandlers.push({ codes, handle });
  }
};

ServiceHelper.clearErrorHandlers = () => { errorHandlers.length = 0; };

ServiceHelper.pathForId = async function pathForId(method, operationId) {
  const spec = await specPromise;
  return _.findKey(spec.paths, { [method.toLowerCase()]: { operationId } });
};

// --------------------------------------
export { ServiceHelper as default };
