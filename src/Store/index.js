import Vue from 'vue';
import Vuex from 'vuex';

import ActiveMembership from 'Store/modules/ActiveMembership';
import Settings from 'Store/modules/Settings';

import Storage from 'src/Storage';
import Types from 'Store/Types';

const {
  SET_USER_ID,
  SET_USER_MEMBERSHIPS,
  SET_PROGRESS,
} = Types;

Vue.use(Vuex);

const mutations = {
  [SET_USER_ID]: function setUserId(state, id) {
    state.user.id = id;
  },
  [SET_USER_MEMBERSHIPS]: function setUserMemberships(state, memberships) {
    state.user.destinyMemberships = memberships;
  },
  [SET_PROGRESS]: function setProgress(state, progress) {
    state.loading.progress = progress;
  },
};

const Store = new Vuex.Store({
  strict: process.env.NODE_ENV !== 'production',
  state: {
    loading: {
      progress: -1,
    },

    user: {
      id: Storage.get('B.Net:membershipId') || null,
      destinyMemberships: [],
    },
  },
  mutations,
  modules: {
    activeMembership: ActiveMembership,
    settings: Settings,
  },
});

export { Store as default };

if (module.hot) {
  // accept actions and mutations as hot modules
  module.hot.accept([
    'Store/modules/ActiveMembership',
    'Store/modules/Settings',
  ], () => {
    // require the updated modules
    // have to add .default here due to babel 6 module output
    /* eslint-disable global-require */
    Store.hotUpdate({
      modules: {
        activeMembership: require('Store/modules/ActiveMembership').default,
        settings: require('Store/modules/Settings').default,
      },
    });
    /* eslint-enable global-require */
  });
}
