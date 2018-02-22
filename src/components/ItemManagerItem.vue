<template>
  <div
    :data-item-id="item.id || item.uniqueId"
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
        v-if="!imageLoaded"
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
          v-if="label.value"
          :class="$style[label.type]">
          {{ label.value }}
        </div>
        <img
          :src="item.icon"
          :alt="item.name"
          :class="$style.icon">
      </div>
    </transition>
  </div>
</template>

<script>
import { random } from 'src/utils';

const cache = new Set([]);

export default {
  name: 'ItemManagerItem',
  props: {
    item: {
      type: Object,
      required: true,
    },
    scrollRoot: {
      type: null,
      required: false,
    },
  },
  data() {
    const inCache = cache.has(this.item.icon);
    return {
      visible: false,
      inCache,
      imageLoaded: inCache,
      doTransition: !inCache,
      maybeLazyLoad: !inCache,
      observer: null,
    };
  },
  computed: {
    classes() {
      const classes = [
        this.$style.content,
        {
          // eslint-disable-next-line no-bitwise
          [this.$style.equipped]: this.item.transferStatus & 1,
          [this.$style.unequippable]: !this.item.equippable,

          // TODO: Figure out an equivalent
          // [this.$style.complete]: this.item.isGridComplete,
          [this.$style.selected]: this.selected,
        },
      ];

      if (this.item.damageType) {
        const damageClassName = this.$style[`damage-${this.item.damageType}`];
        if (damageClassName) {
          classes.push(damageClassName);
        }
      }

      if (this.item.inventory.tierType) {
        const tierClassName = this.$style[`type-${this.item.inventory.tierType}`];
        if (tierClassName) {
          classes.push(tierClassName);
        }
      }

      return classes;
    },
    label() {
      if (this.item.primaryStat) {
        const { value = '' } = this.item.primaryStat || {};
        return {
          type: 'lightLevel',
          value: String(value),
        };
      } else if (this.item.stackSize && this.item.inventory.maxStackSize > 1) {
        return {
          type: 'quantity',
          value: String(this.item.stackSize),
        };
      }

      return {
        type: 'default',
        value: '',
      };
    },
    selected() {
      // TODO: Finish.
      return false;
    },
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

        if (!this.maybeLazyLoad) {
          this.imageLoaded = true;
          this.cleanupObserver(this.observer);
          this.observer = null;
          return;
        }
      }

      if (entry.isIntersecting && entry.intersectionRatio >= 0 && this.maybeLazyLoad) {
        this.cleanupObserver(this.observer);
        this.observer = null;

        const img = new Image();
        const imageLoaded = () => {
          cache.add(this.item.icon);
          img.removeEventListener('load', imageLoaded);
          this.imageLoaded = true;
        };
        img.addEventListener('load', imageLoaded);

        const imageError = (event) => {
          img.removeEventListener('error', imageError);
          console.warn('Failed to load image', event);
        };
        img.addEventListener('error', imageError);

        img.src = this.item.icon;
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
    random,

    click(event) {
      if (this.$itemCard) {
        if (!this.selected) {
          this.$itemCard.showSelected({ item: this.item, event });
        } else {
          this.$itemCard.hide({ forceUnpin: false });
        }
      }
    },
    mouseMove(event) {
      if (!this.selected && this.$itemCard) {
        this.$itemCard.showHover({ item: this.item, event });
      }
    },
    mouseOut() {
      if (!this.selected && this.$itemCard) {
        this.$itemCard.hide({ forceUnpin: false });
      }
    },

    cleanupObserver(observer) {
      if (!observer) {
        return;
      }

      observer.disconnect();
    },
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
}

.content {
  position: absolute;
  text-align: right;
  cursor: pointer;
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
