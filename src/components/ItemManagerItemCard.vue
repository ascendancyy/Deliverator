<template>
  <transition
    :enter-active-class="$style.cardEnterActive"
    :leave-active-class="$style.cardLeaveActive"
    :leave-to-class="$style.cardLeaveTo">
    <div
      v-blur="pinned ? clickOut : null"
      v-if="itemInstance && definition"
      ref="card"
      :class="classes"
      :style="cardStyle">
      <div :class="$style.header">
        <div :class="$style.damageColor" />
        <div :class="$style.itemName">
          {{ definition.displayProperties.name }}
        </div>
        <div
          v-if="definition.itemTypeDisplayName"
          :class="$style.itemTier">
          {{ definition.itemTypeDisplayName }}
        </div>
        <BaseIcon
          v-show="pinned"
          :size="16"
          :class="$style.closeButton"
          glyph="cancel"
          @click="hide"
        />
      </div>

      <div
        v-show="itemLocation && itemInstance.owner !== activeCharacterId"
        :class="$style.itemLocation">
        {{ itemLocation }}
        <span
          v-show="itemEquipped"
          :class="$style.itemLocationEquipped">
          Equipped
        </span>
      </div>

      <div
        v-show="!pinned && definition.displayProperties.description"
        :class="$style.itemDescription">
        {{ definition.displayProperties.description }}
      </div>
      <template v-if="pinned">
        <template v-if="definition.inventory.maxStackSize > 1 && itemQuantity > 1">
          <div :class="$style.itemAmountSlider">
            <BaseLabel for="card-slider">
              Amount: {{ amount }}
            </BaseLabel>
            <BaseRange
              id="card-slider"
              v-model.number="amount"
              :min="1"
              :max="itemQuantity"
            />
          </div>
        </template>
        <div :class="$style.actions">
          <template v-for="{ name, location } in actions">
            <div
              :key="`action-${location.id}`"
              :class="[
                $style.action,
                { [$style.actionHover]: hoveredActionId === location.id }
              ]"
              @mouseleave="hoveredActionId = -1"
              @mouseenter="hoveredActionId = location.id"
              @click="action(location.id)">
              <CharacterEmblem
                :size="288 / Math.max(Object.keys(actions).length, 3)"
                :src="location.emblemPath"
              />
            </div>
            <div
              :key="`label-${location.id}`"
              :class="[
                $style.actionLabelWrapper,
                { [$style.actionLabelHover]: hoveredActionId === location.id }
              ]"
              :style="{ color: `#${location.emblemColor}` }"
              @mouseleave="hoveredActionId = -1"
              @mouseenter="hoveredActionId = location.id"
              @click="action(location.id)">
              <span :class="$style.actionLabel">{{ name }}</span>
            </div>
          </template>
        </div>
      </template>
    </div>
  </transition>
</template>

<script>
import _ from 'lodash';
import { mapState, mapGetters } from 'vuex';

import Store from 'src/Store';

import Identifiers from 'B.Net/Identifiers';

import CharacterEmblem from 'components/CharacterEmblem';

import { style } from 'src/utils';

function viewport() {
  return {
    width: Math.max(document.documentElement.clientWidth, window.innerWidth || 0),
    height: Math.max(document.documentElement.clientHeight, window.innerHeight || 0),
  };
}

export default {
  name: 'ItemCard',
  store: Store,
  components: {
    CharacterEmblem,
  },
  data() {
    return {
      amount: 0,
      definition: null,

      hoveredActionId: -1,

      windowSize: viewport(),

      cardStyle: {
        transform: '',
      },
    };
  },
  computed: {
    ...mapGetters('activeMembership', ['sortedCharacters']),
    ...mapState('activeMembership', [
      'definitions',
      'activeCharacterId',
      'characters',
      'vault',
      'inspectedItemId',
      'selectedItemId',
    ]),
    classes() {
      const classes = [
        this.$style.card,
        {
          [this.$style.pinned]: this.pinned,
          [this.$style.animate]: this.pinned,
        },
      ];

      const { damageType } = this.itemInstance;
      if (damageType) {
        const damageClassName = this.$style[`damage-${damageType}`];
        if (damageClassName) {
          classes.push(damageClassName);
        }
      }

      const { definition } = this;
      if (definition) {
        const { inventory: { tierType } } = definition;

        const tierClassName = this.$style[`tier-${tierType}`];
        if (tierClassName) {
          classes.push(tierClassName);
        }
      }

      return classes;
    },

    pinned() { return this.selectedItemId !== -1; },

    itemInstance() {
      const { inspectedItemId, selectedItemId } = this;
      if (inspectedItemId === -1 && selectedItemId === -1) {
        return null;
      }

      const id = selectedItemId !== -1 ?
        selectedItemId :
        inspectedItemId;
      return this.$store.state.activeMembership.itemInstances[id];
    },
    itemLocation() {
      const { itemInstance } = this;
      if (itemInstance.owner === Identifiers.VAULT) {
        return this.vault.name;
      } else if (itemInstance.owner === 'account') {
        return 'Account';
      }

      try {
        const { race, class: characterClass, light } = this.characters[itemInstance.owner];
        return `${race} ${characterClass} (${light})`;
      } catch (e) {
        return '';
      }
    },
    itemEquipped() {
      // eslint-disable-next-line no-bitwise
      return this.itemInstance.transferStatus & 1 || false;
    },
    itemQuantity() {
      return this.itemInstance.quantity || 0;
    },

    actions() {
      const { itemInstance, definition } = this;
      if (
        !definition ||
        (definition && definition.nonTransferrable && !itemInstance.canEquip)
      ) {
        return [];
      }

      if (itemInstance.owner === 'account') {
        return [{
          name: 'Store',
          location: this.vault,
        }];
      } else if (itemInstance.bucket.location === 0) {
        return [{
          name: 'Take',
          location: this.characters[this.activeCharacterId],
        }];
      }

      const characters = this.sortedCharacters.slice();
      if (itemInstance.owner !== Identifiers.VAULT) {
        characters.unshift(this.vault);
      }

      const locations = characters.filter((character) => {
        const isOwner = character.id === itemInstance.owner;
        if (
          this.itemEquipped ||
          (isOwner && !itemInstance.canEquip) ||
          (!isOwner && (definition.nonTransferrable || itemInstance.transferStatus > 0))
        ) {
          return false;
        }

        return true;
      });

      return locations.map((location) => {
        const isOwner = location.id === itemInstance.owner;
        let name = '';
        if (location.id === Identifiers.VAULT) {
          name = 'Store';
        } else {
          name = isOwner ? 'Equip' : 'Transfer';
        }
        return {
          name,
          location,
        };
      });
    },
  },
  watch: {
    async definitions(newDefinitions) {
      if (!newDefinitions || !this.itemInstance) {
        return;
      }

      const db = await newDefinitions;
      this.definition = await db.InventoryItem[this.itemInstance.itemHash];
    },
    async itemInstance(newItemInstance) {
      if (!newItemInstance) {
        return;
      }

      this.amount = newItemInstance.quantity || 0;
      const db = await this.definitions;
      this.definition = await db.InventoryItem[newItemInstance.itemHash];
    },
  },
  mounted() {
    window.addEventListener('resize', _.debounce(() => {
      this.hide();
      ({
        width: this.windowSize.width,
        height: this.windowSize.height,
      } = viewport());
    }, 32, { leading: true, trailing: true }));
  },
  methods: {
    action() {
      this.hide();
    },

    pin({ target }) {
      document.addEventListener('scroll', this.hide, { capture: true, passive: true });

      const rect = target.getBoundingClientRect();
      let x = rect.right + 2;
      let y = rect.top - 1;
      this.$nextTick(() => {
        const { width = 288, height = 0 } = this.$refs.card.getBoundingClientRect();
        if (width === 0 && height === 0) {
          return;
        }

        if (x + width > this.windowSize.width) {
          x -= (width + rect.width + (2 * 2));
        }

        if (y + height > this.windowSize.height) {
          y = (rect.bottom - height) + 2;
        }

        this.cardStyle = {
          transform: `translateX(${Math.round(x)}px)
                      translateY(${Math.round(y)}px)`,
        };
      });
    },
    unpin(event) {
      document.removeEventListener('scroll', this.hide, { capture: true, passive: true });
      this.moveCardToCursor(event);
    },

    moveCardToCursor({ clientX, clientY }) {
      const { card } = this.$refs;
      const { width = 288, height = 0 } = (card && card.getBoundingClientRect()) || {};

      const offsetX = parseInt(style(document.documentElement, '--item-size'), 10) / 2;
      let x = clientX + offsetX;
      let y = clientY;

      if (x + width > this.windowSize.width) {
        x -= (width + (offsetX * 2));
      }

      const difference = this.windowSize.height - (y + height);
      if (difference < 0) {
        y += difference;
      }

      this.cardStyle = {
        transform: `translateX(${Math.round(x)}px)
                    translateY(${Math.round(y)}px)`,
      };
    },

    hide() {
      document.removeEventListener('scroll', this.hide, { capture: true, passive: true });
      this.$store.commit('activeMembership/SET_SELECTED_ITEM_ID', -1);
      this.$store.commit('activeMembership/SET_INSPECTED_ITEM_ID', -1);
    },

    clickOut({ target }) {
      const { itemId } = target.dataset;
      if (!itemId) { this.hide(); }
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

$item-card-width: 288px;

.card {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 3;

  width: $item-card-width;

  user-select: none;
  pointer-events: none;

  background-color: $bg-gray;
  box-shadow: 0 2px 4px $shadow-color,
              0 1px 8px $shadow-color,
              0 0 12px $shadow-color;

  transition-property: color, background-color;
  transition-duration: 225ms;
  transition-timing-function: $standard-curve;

  &.pinned {
    user-select: auto;
    pointer-events: auto;
  }

  &.animate { transition-property: color, background-color, transform; }
}

.tier-3,
.tier-4,
.tier-5,
.tier-6 {
  color: $fg-white;
}

.tier-2 { color: $fg-black; }

.tier-3 { background-color: rgb(54, 111, 66); }
.tier-4 { background-color: rgb(80, 118, 163); }
.tier-5 { background-color: rgb(82, 47, 101); }
.tier-6 { background-color: rgb(206, 174, 51); }

.header {
  position: relative;

  display: grid;
  grid-template: 'damage-color name close' 1fr
                 'damage-color tier .' min-content
                 / min-content 1fr calc(16px + 8px);
}

.damageColor {
  grid-area: damage-color;
  transition: background-color 225ms $standard-curve;

  .damage-1 &,
  .damage-2 &,
  .damage-3 &,
  .damage-4 & {
    width: 18px;
  }

  .damage-1 & { background-color: $bg-white; }
  .damage-2 & { background-color: rgb(67, 202, 247); }
  .damage-3 & { background-color: rgb(255, 141, 48); }
  .damage-4 & { background-color: rgb(187, 119, 255); }
}

.itemName {
  margin: 16px 16px 0;
  font-size: $font-scale-2;
  line-height: 1;
}

.itemTier {
  grid-area: tier;
  margin: 4px 16px 16px;
  font-size: $font-scale-0;
  opacity: 0.75;
}

.closeButton {
  display: flex;
  justify-content: center;
  align-items: center;
  grid-area: close;

  margin-top: 8px;
  margin-right: 8px;
  padding: 2px;

  opacity: 0.5;
  fill: $bg-white;

  .tier-2 & { fill: $bg-black; }

  &:hover {
    cursor: pointer;
    opacity: 0.75;
  }
}

.itemLocation {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 8px 16px;

  color: $fg-white;

  background-color: transparentize($bg-black, 0.25);
}

.itemLocationEquipped {
  font-size: $font-scale-0;
  opacity: 0.75;
}

.itemDescription {
  padding: 16px;
  color: transparentize($fg-white, 0.25);
  font-size: $font-scale-0;
  background-color: transparentize($bg-black, 0.5);
}

.itemAmountSlider {
  width: 100%;
  padding: 8px 16px;
}

.actions {
  display: grid;
  justify-items: center;
  justify-content: start;
  align-items: center;
  grid-template-rows: [emblem-start] 1fr [emblem-end label-start] min-content [label-end];
  grid-template-columns: repeat(auto-fit, 1fr);

  background-color: transparentize($bg-white, 0.75);
}

.action {
  grid-row: emblem;
  opacity: 0.75;
  filter: saturate(50%);

  transition-property: opacity, filter;
  transition-duration: 225ms;
  transition-timing-function: $standard-curve;

  &.actionHover,
  &:hover {
    cursor: pointer;
    opacity: 1;
    filter: saturate(100%);
  }
}

.actionLabelWrapper {
  position: relative;
  grid-row: label;

  width: 100%;
  height: 100%;
  padding: 4px;

  color: $fg-black;
  text-align: center;

  opacity: 0.75;
  background-color: transparentize($bg-black, 0.5);

  transition: opacity 225ms $standard-curve;

  &:after {
    content: '';

    position: absolute;
    top: 0;
    left: 0;

    width: 100%;
    height: 100%;

    opacity: 0.5;
    background-color: currentColor;
  }

  &.actionLabelHover,
  &:hover {
    cursor: pointer;
    opacity: 1;
  }
}

.actionLabel {
  position: relative;
  z-index: 1;
  color: $fg-white;
}

.cardEnterActive,
.cardLeaveActive {
  transition: opacity 60ms linear;
}

.cardLeaveTo { opacity: 0; }
</style>
