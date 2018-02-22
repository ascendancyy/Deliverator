import Vue from 'vue';
import { raf, cancelRaf } from 'src/utils';

const callbacks = new WeakMap([]);

function cleanup(el) {
  if (callbacks.has(el)) {
    el.removeEventListener('scroll', callbacks.get(el), {
      capture: false,
      passive: true,
    });
    callbacks.delete(el);
  }
}

function bind(el, binding) {
  cleanup(el);
  const { value: cb, name, arg = 0 } = binding;
  if (typeof cb !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      Vue.util.warn(`v-${name} expects a function for its binding, but got ${cb.toString()}`);
    }
    return;
  }

  let scrollRaf;
  function scrollHandler(event) {
    cancelRaf(scrollRaf);
    scrollRaf = raf(() => {
      if (el.scrollTop > arg) {
        return cb({ scrolled: true, event });
      }
      return cb({ scrolled: false, event });
    });
  }

  callbacks.set(el, scrollHandler);

  el.addEventListener('scroll', callbacks.get(el), {
    capture: false,
    passive: true,
  });
}

const Scroll = {
  name: 'scroll',
  bind,
  update: function update(el, binding) {
    if (binding.value === binding.oldValue) {
      return;
    }
    bind(el, binding);
  },
  unbind: cleanup,
};

export { Scroll as default };
