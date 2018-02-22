import Vue from 'vue';
import VueRouter from 'vue-router';

import uuid from 'uuid/v4';

import Storage from 'src/Storage';
import Store from 'src/Store';

import Paths from 'B.Net/Paths';
import { authorized, retrieveTokens } from 'B.Net/auth';

Vue.use(VueRouter);

const Router = new VueRouter({
  mode: 'history',
  routes: [
    {
      name: 'home',
      path: '/',
      component: () => import(/* webpackChunkName: "main-view" */ 'views/App'),
      meta: { requiresAuth: true },
    }, {
      name: 'authenticate',
      path: '/authenticate',
      component: () => import(/* webpackChunkName: "auth" */ 'views/Authenticate'),
      props: () => {
        const authURL = (`${Paths.AUTH}?client_id=${process.env.BNET_CLIENT_ID}` +
                         `&response_type=code&redirect_uri=${Paths.REDIRECT}`);
        const state = (
          Storage.get('B.Net:state', 'session') ||
          Storage.set('B.Net:state', uuid(), 'session')
        );
        return {
          name: process.env.BNET_APP_NAME,
          url: state ? `${authURL}&state=${state}` : authURL,
        };
      },
    }, {
      path: '*',
      redirect: { name: 'home' },
    },
  ],
});

Router.beforeEach(async (to, from, next) => {
  const { query: { code, state = '' } } = to;
  if (code && state === Storage.get('B.Net:state', 'session')) {
    try {
      const { membershipId } = await retrieveTokens(code);
      Store.commit('SET_USER_ID', membershipId);
    } catch (e) {
      console.warn(e);
      next({ name: 'authenticate' });
      return;
    }
  }

  if (to.matched.some(record => record.meta.requiresAuth)) {
    if (!authorized()) {
      next({ name: 'authenticate' });
      return;
    }
  }

  next();
});

Router.beforeResolve((to, from, next) => {
  const matched = Router.getMatchedComponents(to);
  const prevMatched = Router.getMatchedComponents(from);
  let diffed = false;
  const activated = matched.filter((def, idx) => {
    const mismatch = prevMatched[idx] !== def;
    if (diffed || mismatch) {
      if (mismatch) { diffed = true; }
      return true;
    }
    return false;
  });
  const initHooks = Array.from(activated, def => def.init)
    .filter(hook => typeof hook === 'function');
  if (initHooks.length === 0) {
    next();
    return;
  }

  Promise.all(initHooks.map(hook => hook({ store: Store, route: to })))
    .finally(() => {
      next();
      window.history.replaceState(null, '', window.location.href.split('?')[0]);
    });
});

export { Router as default };
