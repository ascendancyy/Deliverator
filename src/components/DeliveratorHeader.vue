<template>
  <div :class="$style.header">
    <div :class="$style.filters">
      <ItemManagerSearch />
      <BaseSelect
        v-model="storageType"
        :options="options">
        <BaseOption
          slot="item"
          slot-scope="option"
          :option="option">
          <span>{{ option.label }}</span>
        </BaseOption>
      </BaseSelect>
    </div>

    <div :class="$style.actions">
      <BaseButton
        tabindex="0"
        :disabled="true"
        @click="$emit('B.Net:refresh')">
        <BaseIcon
          slot="icon"
          glyph="refresh"
          :size="10"
        />
        Refresh
      </BaseButton>
      <BaseButton
        tabindex="0"
        :toggled="String(settingsVisible)"
        @click="$emit('app:settings:toggle')">
        <BaseIcon
          slot="icon"
          glyph="gear"
          :size="10"
        />
        Settings
      </BaseButton>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import ItemManagerSearch from 'components/ItemManagerSearch';

import Identifiers from 'B.Net/Identifiers';

export default {
  name: 'DeliveratorHeader',
  components: {
    ItemManagerSearch,
  },
  props: {
    settingsVisible: {
      type: Boolean,
    },
  },
  computed: {
    ...mapGetters('activeMembership', ['sortedCharacters']),
    storageType: {
      get() { return this.$store.state.activeMembership.storageType; },
      set(type) { this.$store.commit('activeMembership/SET_STORAGE_TYPE', type); },
    },
    options() {
      const all = 'all';
      const vault = Identifiers.VAULT;
      return [
        { id: all, value: all, label: 'All Other Items' },
        ...this.sortedCharacters.map(character => ({
          id: character.id,
          value: character.id,
          label: `${character.race} ${character.class} (${character.light})`,
          disabled: character.id === this.$store.state.activeMembership.activeCharacterId,
        })),
        { id: vault, value: vault, label: 'Vault Items' },
      ];
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.header,
.filters,
.actions {
  display: grid;
  grid-gap: 4px;
}

.header {
  position: relative;
  z-index: 1;

  grid-template: 'filters' fit-content(30px)
                 'actions' 1fr
                 / auto;
  grid-area: header;

  height: 80px;
  padding: 8px 16px 8px 28px;

  border-bottom: 1px solid $bg-pale-white-accent;
  background-color: $bg-pale-white;
}

.filters,
.actions {
  justify-content: end;
  grid-auto-flow: column;
}

.filters {
  grid-template-columns: minmax(100px, 9fr);
  grid-template-areas: 'primary';
  grid-auto-columns: minmax(max-content, 5fr);
  grid-area: filters;
}

.actions {
  grid-auto-columns: min-content;
  grid-area: actions;
}
</style>
