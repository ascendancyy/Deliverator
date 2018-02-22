const BASE = 'https://www.bungie.net';
const API = `${BASE}/Platform`;

const Paths = {
  BASE,
  API,
  AUTH: `${BASE}/en/OAuth/Authorize/`,
  TOKEN: `${API}/App/OAuth/Token/`,
  REDIRECT: encodeURIComponent(process.env.BNET_REDIRECT_URL),
};

export { Paths as default };
