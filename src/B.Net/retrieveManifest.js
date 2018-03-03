import _ from 'lodash';

import Paths from 'B.Net/Paths';
import Service from 'B.Net/Service';
import Definitions from 'B.Net/Definitions';

import Storage from 'src/Storage';

import wasmPath from 'sql.js/js/sql-optimized-wasm-raw.wasm';

const fallbackSQL = _.once((err) => {
  console.warn(err);
  return new Promise(async (resolve) => {
    const ctor = import(/* webpackChunkName: "sql" */ 'sql.js');
    (await ctor)()
      .then(({ SQL }) => {
        resolve(SQL);
        window.SQL = null;
      });
  });
});

const importSQL = _.once(() => {
  if (typeof WebAssembly === 'object') {
    return new Promise(async (resolve, reject) => {
      try {
        const ctor = import(/* webpackChunkName: "sql.wasm" */ 'sql.js/js/sql-optimized-wasm');
        (await ctor)({ locateFile: () => wasmPath })
          .then(({ SQL }) => {
            resolve(SQL);
            window.SQL = null;
          });
      } catch (e) {
        reject(e);
      }
    }).catch(fallbackSQL);
  }

  return fallbackSQL(new Error('WebAssembly not available'));
});

// ---------------------------------------
let database = null;

const manifest = {
  value: null,
  language: null,

  changePromise: null,
};

// ---------------------------------------
function openDatabase() {
  if (!window.indexedDB) {
    const message = ('Your browser does not support a stable version of IndexedDB. ' +
                     'The manifest will not be able to be stored.');
    return Promise.reject(new Error(message));
  }

  if (database) {
    return Promise.resolve(database);
  }

  const request = window.indexedDB.open('Deliverator', 1);
  request.onupgradeneeded = event => event.target.result.createObjectStore('manifest-store');

  return new Promise((resolve, reject) => {
    request.onsuccess = function databaseSuccess() {
      database = request.result;

      database.onerror = function databaseError(event) {
        console.warn('Database error:', event);
      };

      resolve(database);
    };

    request.onerror = reject;
  });
}

// Local Manifest------------------------
function readBlob(blob) {
  const reader = new FileReader();
  reader.readAsArrayBuffer(blob);

  return new Promise((resolve, reject) => {
    reader.onload = async function loaded({ target: { result } }) {
      if (!(result instanceof ArrayBuffer)) {
        reject(new Error('Error reading stored blob'));
      }

      const array = new Uint8Array(result);
      const SQL = await importSQL();
      resolve(new SQL.Database(array));
    };

    reader.onerror = function error(event) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('Error reading stored blob', event);
      }

      reject(event.target.result);
    };
  });
}

async function manifestFromIndexedDB() {
  let transaction;
  try {
    transaction = (await openDatabase()).transaction(['manifest-store'], 'readonly');
  } catch (error) {
    console.warn('Could not get manifest. IndexedDB not supported', error);
    return Promise.reject(error);
  }
  const get = transaction.objectStore('manifest-store').get('manifest');

  return new Promise((resolve, reject) => {
    get.onsuccess = function transactionSuccess({ target: { result: blob } }) {
      if (blob) {
        resolve(readBlob(blob));
      } else {
        reject(new Error('Manifest blob was empty'));
      }
    };

    get.onerror = reject;
  });
}

// Remote Manifest-----------------------
async function storeManifest(blob, location) {
  let transaction;
  try {
    transaction = (await openDatabase()).transaction(['manifest-store'], 'readwrite');
  } catch (error) {
    console.warn('Could not save manifest. IndexedDB not supported', error);
    return Promise.resolve(false);
  }
  const put = transaction.objectStore('manifest-store').put(blob, 'manifest');

  return new Promise((resolve, reject) => {
    put.onsuccess = function success() {
      resolve(true);
      Storage.set('B.Net:manifestLocation', location);
    };

    put.onerror = reject;
  });
}

async function readZip(zip, location) {
  const array = await zip.file(/world/)[0].async('uint8array');

  storeManifest(new Blob([array], { type: 'application/sql' }), location);
  const SQL = await importSQL();
  return new SQL.Database(array);
}

function manifestFromRemote(location, progressCallback) {
  const req = new XMLHttpRequest();
  req.responseType = 'arraybuffer';
  req.open(
    'GET',
    (`${Paths.BASE}${location}?app=${process.env.BNET_APP_NAME}` +
     `&ver=${process.env.APP_VERSION}`),
  );

  if (typeof progressCallback === 'function') {
    req.onprogress = event => progressCallback(event.loaded / event.total);
  }

  return new Promise((resolve) => {
    req.onreadystatechange = async function ready() {
      if (req.readyState === req.DONE && (req.status === 200 || req.status === 0)) {
        console.group('Retrieving manifest from remote');
        console.log(location);
        console.groupEnd('Retrieving manifest from remote');

        const JSZip = await import(/* webpackChunkName: "zip" */ 'jszip');
        resolve(readZip(await JSZip.loadAsync(req.response), location));
      }
    };

    req.send();
  });
}

async function manifestChanged(language) {
  const { mobileWorldContentPaths } = await Service.request({
    operationId: 'Destiny2.GetDestinyManifest',
  });
  const location = mobileWorldContentPaths[language];
  const manifestHint = Storage.get('B.Net:manifestLocation');
  const changed = (
    !manifestHint ||
    manifestHint !== location ||
    (manifest.value && (manifest.language !== language))
  );

  if (process.env.NODE_ENV !== 'production') {
    if (changed) {
      if (!manifestHint) {
        console.log('Manifest might not be stored');
      } else if (manifestHint !== location) {
        console.log(`Manifest version mistmatch:\n${manifestHint}\n${location}`);
      } else if (manifest.value && manifest.language !== language) {
        console.log(`New language: ${manifest.language} => ${language}`);
      }
    } else {
      console.log('Manifest has not changed');
    }
  }

  return { changed, location };
}

// ---------------------------------------
async function retrieveManifest(language, progressCallback) {
  if (!manifest.value || (manifest.value && manifest.language !== language)) {
    if (manifest.value) {
      (await manifest.value).close();
      Definitions.close();
    }

    if (!manifest.changePromise) {
      manifest.changePromise = manifestChanged(language);
    }
    const remote = await manifest.changePromise;
    manifest.changePromise = null;

    let storedManifest;
    try {
      storedManifest = await manifestFromIndexedDB();
    } catch (e) {} // eslint-disable-line no-empty

    if (remote.changed || !storedManifest) {
      manifest.value = manifestFromRemote(remote.location, progressCallback);
    } else {
      manifest.value = Promise.resolve(storedManifest);
    }

    manifest.language = language;
  }

  return manifest.value;
}

export { retrieveManifest as default };
