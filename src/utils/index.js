export const raf = window.requestAnimationFrame ||
                   window.webkitRequestAnimationFrame ||
                   window.mozRequestAnimationFrame ||
                   window.msRequestAnimationFrame ||
                   function raf(callback) { return setTimeout(callback, 16); };

export const cancelRaf = window.cancelAnimationFrame ||
                         window.webkitCancelAnimationFrame ||
                         window.mozCancelAnimationFrame ||
                         window.msCancelAnimationFrame ||
                         clearTimeout;

export function nextFrame(func) {
  // eslint-disable-next-line prefer-arrow-callback
  return raf(function frame() {
    raf(func);
  });
}

export function style(element, property) {
  return window.getComputedStyle(element).getPropertyValue(property);
}

export function inlineStyles(url, callback) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function ready() {
      if (xhr.readyState === xhr.DONE && xhr.status === 200) {
        const styleElm = document.createElement('style');

        styleElm.innerHTML = xhr.responseText;
        document.head.appendChild(styleElm);
        if (typeof callback === 'function') {
          styleElm.onload = callback;
        }
        resolve();
      }
    };

    xhr.onerror = reject;
    xhr.open('GET', url, true);
    xhr.send();
  });
}

export function raceTimeout(promises, timeout) {
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Promise timed out after ${timeout}ms`));
    }, timeout);
  });
  return Promise.race([...promises, timeoutPromise]);
}

export function cancelEvent(event) {
  const cancelable = typeof event.cancelable !== 'boolean' || event.cancelable;
  if (cancelable) {
    event.stopImmediatePropagation();
    return true;
  } else if (!cancelable) {
    console.warn('could not prevent event', event);
  }

  return false;
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function random(min = 0, max = 1) {
  return (Math.random() * (max - min)) + min;
}

export function isObject(obj) {
  return obj !== null && typeof obj === 'object';
}

export function looseEqual(a, b) {
  if (a === b) {
    return true;
  }
  const isObjectA = isObject(a);
  const isObjectB = isObject(b);
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a);
      const isArrayB = Array.isArray(b);
      if (isArrayA && isArrayB) {
        return a.length === b.length && a.every((e, i) => looseEqual(e, b[i]));
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);
        return keysA.length === keysB.length && keysA.every(key => looseEqual(a[key], b[key]));
      }

      return false;
    } catch (e) {
      return false;
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b);
  } else {
    return false;
  }
}

export function isTrue(v) {
  return v === true;
}

export function isFalse(v) {
  return v === false;
}

export function isPrimitive(value) {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

export function prefixURL(url, prefix) {
  // eslint-disable-next-line no-bitwise
  return !~url.indexOf(prefix) && prefix ?
    prefix + url :
    url;
}
