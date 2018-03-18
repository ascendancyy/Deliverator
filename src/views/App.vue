<template>
  <div>
    <main :class="classes">
      <DeliveratorSidebar :collapsed.sync="sidebarCollapsed" />
      <DeliveratorHeader
        :settings-visible="settingsVisible"
        @app:settings:toggle="settingsVisible = !settingsVisible"
      />
      <ItemManager />

    </main>
    <DeliveratorSettings :visible.sync="settingsVisible" />
  </div>
</template>

<script>
import Vue from 'vue';

import Service from 'B.Net/Service';

import Storage from 'src/Storage';

import DeliveratorHeader from 'components/DeliveratorHeader';
import DeliveratorSettings from 'components/DeliveratorSettings';
import DeliveratorSidebar from 'components/DeliveratorSidebar';
import ItemManager from 'components/ItemManager';
import ItemManagerItemCard from 'components/ItemManagerItemCard';

// Global Card
const itemCard = new Vue(ItemManagerItemCard).$mount();
Vue.prototype.$itemCard = itemCard;
document.body.appendChild(itemCard.$el);

export default {
  name: 'App',
  components: {
    DeliveratorHeader,
    DeliveratorSettings,
    DeliveratorSidebar,
    ItemManager,
  },
  data() {
    return {
      settingsVisible: false,
      sidebarCollapsed: false,
    };
  },
  computed: {
    classes() {
      return [
        this.$style.app,
        {
          [this.$style['sidebar-collapsed']]: this.sidebarCollapsed,
          [this.$style['settings-visible']]: this.settingsVisible,
        },
      ];
    },
  },
  async init({ store }) {
    store.dispatch('activeMembership/GET_DEFINITIONS');

    await Service.ready;
    const { destinyMemberships } = await Service.request({
      operationId: 'User.GetMembershipDataForCurrentUser',
    });
    store.commit('SET_USER_MEMBERSHIPS', destinyMemberships);

    Vue.nextTick(async () => {
      try {
        await store.dispatch(
          'activeMembership/FETCH_PROFILE',
          Storage.get('B.Net:destinyMembershipType'),
        );
      } catch (e) {
        console.warn(e);
        store.commit('activeMembership/RESET');
      }
    });
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.app {
  position: relative;
  z-index: 1;

  display: grid;
  grid-template: 'sidebar header' 80px
                 'sidebar content' 1fr
                 / calc(230px + 8px) 1fr;

  height: 100vh;

  transition: transform 300ms $standard-curve;

  &:after {
    content: '';

    z-index: 2;

    grid-row: header / content;
    grid-column: sidebar / content;

    pointer-events: none;

    opacity: 0;
    background-color: $bg-white;

    transition: opacity 300ms $standard-curve;
  }

  &.sidebar-collapsed {
    grid-template: 'sidebar header' 80px
                   'sidebar content' 1fr
                   / calc(3rem + 16px + 1px) 1fr;
  }

  &.settings-visible {
    user-select: none;
    pointer-events: none;
    transform: translateX(-320px);
  }

  &.settings-visible:after { opacity: 0.66; }
}
</style>
