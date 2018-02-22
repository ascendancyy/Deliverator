import Vue from 'vue';

const callbacks = new WeakMap([]);

function cleanup(el) {
  if (callbacks.has(el)) {
    document.documentElement.removeEventListener('mousedown', callbacks.get(el), false);
    callbacks.delete(el);
  }
}

function bind(el, binding) {
  cleanup(el);
  const { value: cb, name } = binding;
  if (typeof cb !== 'function') {
    if (process.env.NODE_ENV !== 'production') {
      Vue.util.warn(`v-${name} expects a function for its binding, but got ${cb.toString()}`);
    }
    return;
  }

  function blurHandler(event) {
    if (!el.contains(event.target)) {
      return cb(event);
    }
    return null;
  }

  callbacks.set(el, blurHandler);
  document.documentElement.addEventListener('mousedown', callbacks.get(el), false);
}

const Blur = {
  name: 'blur',
  bind,
  update: function update(el, binding) {
    if (binding.value === binding.oldValue) {
      return;
    }
    bind(el, binding);
  },
  unbind: cleanup,
};

export { Blur as default };
