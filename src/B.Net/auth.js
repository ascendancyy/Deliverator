import Paths from 'B.Net/Paths';

import Storage from 'src/Storage';
import Router from 'src/Router';

// --------------------------------------
const CLIENT_ID = process.env.BNET_CLIENT_ID;
const CLIENT_SECRET = process.env.BNET_CLIENT_SECRET;

const BASIC_AUTH = `Basic ${btoa(`${CLIENT_ID}:${CLIENT_SECRET}`)}`;

// Util ---------------------------------
export function expired(expires, inception) {
  return (inception + expires) - 20000 < Date.now();
}

// App Service---------------------------
function request(params) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.onerror = reject;

    xhr.open('POST', Paths.TOKEN, true);
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.setRequestHeader('Authorization', BASIC_AUTH);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        if (xhr.response.error) {
          reject(new Error(xhr.response.error));
        } else {
          resolve(xhr.response);
        }
      }
    };

    xhr.send(params);
  });
}

function TokenRequest(code) {
  const params = `grant_type=authorization_code&code=${code}&redirect_uri=${Paths.REDIRECT}`;
  return request(params);
}

function RefreshToken(token) {
  const params = `grant_type=refresh_token&refresh_token=${token}`;
  return request(params);
}

// --------------------------------------
function localTokens() {
  const tokens = Storage.get('B.Net:tokens');
  const membershipId = Storage.get('B.Net:membershipId');
  if (tokens && membershipId) {
    return Promise.resolve({ tokens, membershipId });
  }
  return Promise.reject(new Error('Could not retrieve tokens from local storage'));
}

function saveTokens(resp) {
  const {
    membership_id: membershipId,
    access_token: accessToken,
    expires_in: accessExpires,

    refresh_token: refreshToken,
    refresh_expires_in: refreshExpires,
  } = resp;

  const tokens = {
    inception: Date.now(),
    access: {
      value: accessToken,
      expires: Number(accessExpires) * 1000,
    },
    refresh: {
      value: refreshToken,
      expires: Number(refreshExpires) * 1000,
    },
  };

  const membershipSet = Boolean(Storage.set('B.Net:membershipId', membershipId));
  const tokensSet = Boolean(Storage.set('B.Net:tokens', tokens));
  if (process.env.NODE_ENV !== 'production') {
    if (membershipSet && tokensSet) {
      console.log(`Stored tokens (${membershipId}):`, tokens);
    }
  }

  return {
    tokens,
    membershipId,
  };
}

function refreshExpiredTokens({ tokens, membershipId }) {
  const { access, refresh, inception } = tokens;
  if (expired(access.expires, inception) && !expired(refresh.expires, inception)) {
    return RefreshToken(refresh.value).then(saveTokens);
  }

  return {
    tokens,
    membershipId,
  };
}

// --------------------------------------
export function retrieveTokens(code) {
  const tokenPromise = !code ?
    localTokens().then(refreshExpiredTokens) :
    TokenRequest(code).then(saveTokens);

  return tokenPromise.catch(() => Router.push({ name: 'authenticate' }));
}

export function getBearerToken() {
  return retrieveTokens().then(({ tokens: { access } }) => `Bearer ${access.value}`);
}

// --------------------------------------
export function authorized() {
  return Storage.get('B.Net:membershipId') && Boolean(Storage.get('B.Net:tokens'));
}
