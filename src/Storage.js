function set(key, obj, type = 'local') {
  const value = JSON.stringify(obj);
  try {
    if (type === 'local') {
      localStorage.setItem(key, value);
    } else if (type === 'session') {
      sessionStorage.setItem(key, value);
    }
  } catch (e) {
    return null;
  }
  return obj;
}

function get(key, type = 'local') {
  try {
    if (type === 'local') {
      return JSON.parse(localStorage.getItem(key));
    }

    return JSON.parse(sessionStorage.getItem(key));
  } catch (e) {
    return null;
  }
}

function remove(key, type = 'local') {
  try {
    if (type === 'local') {
      localStorage.removeItem(key);
    } else if (type === 'session') {
      sessionStorage.removeItem(key);
    }
  // eslint-disable-next-line no-empty
  } catch (e) {}
}

const Storage = {
  set,
  get,
  remove,
};

export { Storage as default };
