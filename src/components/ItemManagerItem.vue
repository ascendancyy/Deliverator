<template>
  <div
    :data-item-id="instance.id"
    :class="$style.item"
    @click.capture.stop="click"
    @mousemove.passive="mouseMove"
    @mouseleave.passive="mouseOut">
    <transition
      :enter-class="doTransition ? $style.imageEnter : ''"
      :enter-active-class="doTransition ? $style.imageEnterActive : ''"
      :leave-active-class="doTransition ? $style.imageLeaveActive : ''"
      :leave-to-class="doTransition ? $style.imageLeaveTo : ''">
      <BaseSkeleton
        v-if="!imageLoaded || !definition"
        key="skeleton"
        :active="visible"
        :style="{
          position: 'absolute',
          width: 'var(--item-size)',
          height: 'var(--item-size)',
          animationDelay: `${Math.floor(random(0, 1000))}ms`,
        }"
      />
      <div
        v-else
        key="item"
        :class="classes">
        <div
          v-if="label"
          :class="$style[label.type]">
          {{ label.value }}
        </div>
        <img
          :src="itemIconSrc"
          :alt="itemName"
          :class="$style.icon">
      </div>
    </transition>
  </div>
</template>

<script>
import { mapState } from 'vuex';

import Paths from 'B.Net/Paths';
import Identifiers from 'B.Net/Identifiers';

import { random, prefixURL } from 'src/utils';

const iconCache = new Set();

export default {
  name: 'ItemManagerItem',
  props: {
    instance: {
      type: Object,
      required: true,
    },
    scrollRoot: {
      type: null,
      required: false,
    },
  },
  data() {
    return {
      definition: null,

      visible: false,
      imageLoaded: false,
      doTransition: false,
      maybeLazyLoad: false,
      observer: null,
    };
  },
  computed: {
    ...mapState('activeMembership', [
      'definitions',
      'inspectedItemId',
      'selectedItemId',
    ]),
    itemIconSrc() {
      if (!this.definition) {
        return '';
      }
      const { icon } = this.definition.displayProperties;
      return !this.definition.displayProperties.hasIcon ?
        'https://www.bungie.net/img/misc/missing_icon_d2.png' :
        prefixURL(icon, Paths.BASE);
    },
    classes() {
      const classes = [
        this.$style.content,
        {
          // eslint-disable-next-line no-bitwise
          [this.$style.equipped]: this.instance.transferStatus & 1,

          // TODO: Figure out an equivalent
          // [this.$style.complete]: this.item.isGridComplete,
          [this.$style.selected]: this.selected,
        },
      ];

      const { damageType } = this.instance;
      if (damageType) {
        const damageClassName = this.$style[`damage-${damageType}`];
        if (damageClassName) {
          classes.push(damageClassName);
        }
      }

      const { definition } = this;
      if (definition) {
        const {
          equippable,
          inventory: { tierType },
        } = definition;

        if (!equippable) {
          classes.push(this.$style.unequippable);
        }

        const tierClassName = this.$style[`type-${tierType}`];
        if (tierClassName) {
          classes.push(tierClassName);
        }
      }

      return classes;
    },
    itemName() {
      if (!this.definition) {
        return '';
      }
      const { displayProperties: { name = '' } } = this.definition;
      return name;
    },
    label() {
      const { bucket, quantity, primaryStat } = this.instance;
      if (bucket.hash === Identifiers.BUCKET_BUILD) {
        return null;
      }

      const { inventory: { maxStackSize = -1 } } = this.definition;
      if (primaryStat) {
        const { value = '' } = primaryStat;
        return {
          type: 'lightLevel',
          value: String(value),
        };
      } else if (quantity && maxStackSize > 1) {
        return {
          type: 'quantity',
          value: String(quantity),
        };
      }

      return null;
    },
    selected() { return this.selectedItemId === this.instance.id; },
  },
  watch: {
    async definitions(newDefinitions) {
      if (!newDefinitions) {
        this.definition = null;
        return;
      }

      this.setDefinition(newDefinitions);
    },
    itemIconSrc(src) {
      if (!this.scrollRoot) {
        return;
      }
      const inCache = iconCache.has(src);
      this.imageLoaded = inCache;
      this.doTransition = !inCache;
      this.maybeLazyLoad = !inCache;
    },
  },
  async created() {
    this.setDefinition(this.definitions);
  },
  mounted() {
    if (!this.scrollRoot) {
      this.imageLoaded = true;
      this.visible = true;
      return;
    }

    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !this.visible) {
        this.visible = true;
      }

      if (!this.definition) {
        return;
      }

      if (!this.maybeLazyLoad) {
        this.cleanupObserver(this.observer);
        this.imageLoaded = true;
        this.observer = null;
      } else if (this.maybeLazyLoad && entry.isIntersecting && entry.intersectionRatio >= 0) {
        this.cleanupObserver(this.observer);
        this.observer = null;

        const img = new Image();
        const imageLoaded = () => {
          iconCache.add(this.itemIconSrc);
          img.removeEventListener('load', imageLoaded);
          this.imageLoaded = true;
        };
        img.addEventListener('load', imageLoaded);

        const imageError = (event) => {
          img.removeEventListener('error', imageError);
          console.warn('Failed to load image', event);
        };
        img.addEventListener('error', imageError);

        img.src = this.itemIconSrc;
      }
    }, {
      root: this.scrollRoot,
      rootMargin: '4px',
      threshold: [0, 0.05, 0.25, 0.5, 1],
    });

    this.observer.observe(this.$el);
  },
  beforeDestroy() {
    if (this.observer) {
      this.cleanupObserver(this.observer);
    }
  },
  methods: {
    click(event) {
      if (!this.selected) {
        this.$store.commit('activeMembership/SET_SELECTED_ITEM_ID', this.instance.id);
        if (this.$itemCard) { this.$itemCard.pin(event); }
      } else {
        this.$store.commit('activeMembership/SET_SELECTED_ITEM_ID', -1);
        if (this.$itemCard) { this.$itemCard.unpin(event); }
      }
    },
    mouseMove(event) {
      if (this.$itemCard && this.selectedItemId === -1) {
        this.$itemCard.moveCardToCursor(event);
      }

      if (this.inspectedItemId !== this.instance.id) {
        this.$store.commit('activeMembership/SET_INSPECTED_ITEM_ID', this.instance.id);
      }
    },
    mouseOut() {
      this.$store.commit('activeMembership/SET_INSPECTED_ITEM_ID', -1);
    },

    cleanupObserver(observer) {
      if (!observer) {
        return;
      }

      observer.disconnect();
    },
    async setDefinition(definitions) {
      const db = await definitions;
      this.definition = await db.InventoryItem[this.instance.itemHash];
    },

    random,
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

$item-border-size: 1px;

.item {
  position: relative;

  margin: var(--item-spacing);
  width: var(--item-size);
  height: var(--item-size);

  cursor: pointer;
}

.content {
  position: absolute;

  text-align: right;

  pointer-events: none;

  border: 1px solid $bg-primary-accent;

  &:not(.equipped):not(.selected):hover { box-shadow: 0 0 5px $shadow-color; }
}

.equipped,
.selected {
  border-color: $bg-focus-accent;
  box-shadow: 0 0 8px transparentize($bg-focus, 0.33);

  &.type-3,
  &.type-4,
  &.type-5,
  &.type-6 {
    border-color: $bg-black-accent;
  }

  &.type-3 { box-shadow: 0 0 8px transparentize(#366f42, 0.33); }
  &.type-4 { box-shadow: 0 0 8px transparentize(#5076a3, 0.33); }
  &.type-5 { box-shadow: 0 0 8px transparentize(#522f65, 0.33); }
  &.type-6 { box-shadow: 0 0 8px transparentize(#ceae33, 0.25); }
}

.lightLevel,
.quantity {
  position: absolute;
  right: $item-border-size;
  bottom: $item-border-size;
  z-index: 1;

  padding-right: 2px;
  padding-left: 3px;

  color: $fg-white;
  font-weight: 600;
  font-size: 0.58em;
  user-select: none;

  background-color: transparentize($bg-black, 0.25);

  transition: opacity 110ms linear;
}

.lightLevel {
  .damage-2 & { background-color: transparentize(rgb(67, 202, 247), 0.33); }
  .damage-3 & { background-color: transparentize(rgb(255, 141, 48), 0.33); }
  .damage-4 & { background-color: transparentize(rgb(187, 119, 255), 0.33); }

  .damage-1 & {
    color: $fg-black;
    background-color: transparentize($bg-white, 0.25);
  }

  .content:hover & { opacity: 0; }
}

.icon {
  display: block;
  width: 100%;
  height: 100%;

  user-select: none;
  pointer-events: none;

  opacity: 0.8;
  background-color: darken($bg-primary, 8%);
  filter: saturate(75%);

  overflow: hidden;

  transition-property: opacity, filter;
  transition-duration: 110ms;

  .complete & { border-color: rgb(255, 191, 0); }

  .selected &,
  .equipped &,
  .unequippable &,
  .item:hover & {
    opacity: 1;
    filter: saturate(100%);
  }
}

.imageEnterActive,
.imageLeaveActive {
  transition: opacity 255ms $standard-curve;
}

.imageEnter,
.imageLeaveTo {
  opacity: 0;
}
</style>
