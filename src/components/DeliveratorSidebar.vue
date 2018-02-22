<template>
  <div :class="[this.$style.sidebar, { [this.$style.collapsed]: collapsed }]">
    <header :class="$style.header">
      <template v-if="!collapsed">
        <BaseLabel
          tag="div"
          @click.native="$refs.select.$el.focus()">
          Account:
        </BaseLabel>
        <BaseSelect
          ref="select"
          :value="platform"
          :disabled="destinyMemberships.length === 0"
          placeholder="Membership"
          :options="options">
          <BaseOption
            slot="item"
            slot-scope="option"
            :option="option">
            <span :class="$style.name">{{ option.label }}</span>
            <span :class="$style.platform">{{ option.value | nameForType }}</span>
          </BaseOption>
        </BaseSelect>
      </template>
      <BaseIcon
        v-else
        key="header-collapsed-icon"
        glyph="account"
        size="1.5rem"
        :class="$style.account"
      />

      <BaseIcon
        glyph="arrow"
        :size="12"
        :class="$style.toggle"
        @click="$emit('update:collapsed', !collapsed)"
      />
    </header>
    <nav :class="$style.characterSelect">
      <transition-group
        tag="ul"
        :class="$style.characters"
        :move-class="$style.plateMove"
        :enter-class="$style.plateEnter"
        :enter-to-class="''"
        :enter-active-class="$style.plateEnterActive"
        :leave-active-class="$style.plateLeaveActive"
        :leave-class="''"
        :leave-to-class="$style.plateLeaveTo">
        <li
          v-for="character in sortedCharacters"
          :key="character.id"
          :class="[
            $style.character,
            { [$style.characterActive]: activeCharacterId == character.id },
          ]"
          :style="{ color: `#${character.emblemColor}` }"
          @click="activeCharacterId = character.id">
          <DeliveratorSidebarNameplate
            v-if="!collapsed"
            key="sidebar-nameplate"
            :character="character"
          />
          <CharacterEmblem
            v-else
            key="sidebar-emblem"
            :src="character.emblemPath"
            size="3rem"
          />
        </li>
      </transition-group>
    </nav>
  </div>
</template>

<script>
import _ from 'lodash';
import { mapState, mapGetters } from 'vuex';

import CharacterEmblem from 'components/CharacterEmblem';
import DeliveratorSidebarNameplate from 'components/DeliveratorSidebarNameplate';

export default {
  name: 'DeliveratorSidebar',
  components: {
    CharacterEmblem,
    DeliveratorSidebarNameplate,
  },
  filters: {
    nameForType(type) {
      let name;
      switch (Number(type)) {
        case 1:
          name = 'Xbox';
          break;
        case 2:
          name = 'Playstation';
          break;
        case 4:
          name = 'Blizzard';
          break;
        default:
          name = 'Unknown';
      }

      return name;
    },
  },
  inheritAttrs: false,
  props: {
    collapsed: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  computed: {
    ...mapState('activeMembership', ['platform']),
    ...mapState({ destinyMemberships: state => state.user.destinyMemberships }),
    ...mapGetters('activeMembership', ['sortedCharacters']),
    activeCharacterId: {
      get() { return this.$store.state.activeMembership.activeCharacterId; },
      set(id) { this.$store.commit('activeMembership/SET_ACTIVE_CHARACTER', id); },
    },
    options() {
      return this.destinyMemberships.map(membership => ({
        id: membership.membershipId,
        value: membership.membershipType,
        label: membership.displayName,
        validator: val => this.optionValidator(val),
      }));
    },
  },
  methods: {
    optionValidator: async function optionValidator(type) {
      if (!_.find(this.destinyMemberships, { membershipType: type })) {
        return false;
      }

      const previousPlatform = this.platform;

      try {
        this.$store.commit('activeMembership/SET_PLATFORM', type);
        await this.$store.dispatch('activeMembership/FETCH_PROFILE');
        return true;
      } catch (e) {
        this.$store.commit('activeMembership/SET_PLATFORM', previousPlatform);
        console.warn(e);
        return false;
      }
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.sidebar {
  position: relative;
  z-index: 2;

  display: grid;
  align-items: center;
  grid-template: 'header' 80px;
  grid-auto-rows: min-content;

  grid-area: sidebar;

  border-right: 1px solid $bg-primary-accent;
  background-color: $bg-primary;

  contain: size;
}

.header {
  position: relative;
  grid-area: header;
  padding: 12px 16px;
}

.account {
  position: relative;
  margin: 0 auto;
  fill: $bg-primary-accent;
}

.name {
  font-size: $font-scale-1;
  line-height: 1;
}

.platform {
  font-size: 76%;
  line-height: 1.5;
  letter-spacing: 0.4px;

  user-select: none;
  opacity: 0.75;
}

.toggle {
  position: absolute;
  top: calc(6px + 8px + 15px / 2);
  right: -20px;

  cursor: pointer;
  opacity: 0.25;
  fill: $bg-black;

  transform: rotateZ(180deg) translateY(50%);

  &:hover { opacity: 0.5; }

  .collapsed & { transform: rotateZ(0) translateY(-50%); }
}

.characterSelect { margin-top: 4px; }

.characters {
  display: grid;
  grid-auto-rows: min-content;
  grid-gap: 8px;

  padding-left: 16px;
  .collapsed & { padding-left: 16px; }
}

.character {
  position: relative;
  z-index: 1;

  color: $bg-white-accent;

  cursor: pointer;

  opacity: 0.75;
  border-radius: $border-radius 0 0 $border-radius;
  background-color: currentColor;
  filter: grayscale(50%);
  transform: translateX(-8px);

  overflow: hidden;
  transition-property: padding, opacity, filter, transform;
  transition-duration: 225ms;
  transition-timing-function: $standard-curve;

  &:before {
    content: '';

    position: absolute;
    top: 0;
    left: 0;
    z-index: 109;

    width: 100%;
    height: 100%;

    opacity: 0.25;
    background-image: linear-gradient(to right, transparent 50%, $bg-pale-white 125%);
    background-position: top right 0%;
    background-size: 200% 100%;
    background-repeat: no-repeat;

    overflow: hidden;

    transition: background-position 300ms $deceleration-curve;
  }

  &:after {
    content: '';

    position: absolute;
    top: 0;
    left: 0;
    z-index: 99;

    width: 100%;
    height: 100%;

    border: 1px solid currentColor;
    border-radius: $border-radius 0 0 $border-radius;
  }

  &:hover:before {
    background-position: top right 150%;
    transition-timing-function: $acceleration-curve;
  }
  &.characterActive:before { background-position: top right 200%; }

  .collapsed &:before { visibility: hidden; }

  &:hover,
  &.characterActive {
    filter: grayscale(0);
  }

  &:hover {
    opacity: 0.75;
    transform: translateX(-4px);
  }

  &.characterActive {
    opacity: 1;
    transform: translateX(0);
  }
}

.plateEnterActive { transition: opacity 225ms $deceleration-curve; }
.plateLeaveActive { transition: opacity 225ms $sharp-curve; }

.plateEnter,
.plateLeaveTo {
  opacity: 0;
}
</style>
