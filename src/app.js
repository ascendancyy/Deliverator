import Vue from 'vue';

import Store from 'src/Store';
import Router from 'src/Router';

// Styling
import 'normalize.css';
import 'Snowcrash/Snowcrash.scss';

import loadFonts from 'src/loadFonts';

loadFonts();

function registerAll(requireContext, type = 'component') {
  requireContext.keys().forEach((fileName) => {
    let config = requireContext(fileName);
    config = config.default || config;
    const name = config.name || (
      fileName
        .replace(/^.+\//, '')
        .replace(/\.\w+$/, '')
    );

    if (process.env.NODE_ENV !== 'production') {
      console.groupCollapsed(`Register ${type}: ${name}`);
      console.log(config);
      console.groupEnd(`Register ${type}: ${name}`);
    }
    Vue[type](name, config);
  });
}

// Global Base Components
registerAll(
  require.context('../src/', true, /Base[A-Za-z]+\.vue$/),
  'component',
);

// Global Directives
registerAll(
  require.context('../src/directives/', true, /[A-Za-z]+\.js$/),
  'directive',
);

// Basic Vue config
Vue.config.devtools = process.env.NODE_ENV !== 'production';
Vue.config.productionTip = false;

// Main Vue instance
const app = new Vue({
  el: '#app',
  store: Store,
  router: Router,
  render(h) { return h('router-view'); },
});

export { app as default };
