<template>
  <li :class="classes">
    <button
      :class="$style.name"
      tabindex="-1"
      type="button"
      @click="$emit('toggle')">
      <div :class="$style.text">{{ name }} {{ itemCapacity }}</div>
      <BaseIcon
        :size="8"
        :class="$style.arrow"
        glyph="dropdown"
      />
    </button>

    <div
      v-for="(ids, index) in buckets"
      :key="`${index}:${hash}`"
      :class="{ [$style.character]: index === 0, [$style.storage]: index > 0 }">
      <ItemManagerBucket
        v-show="expanded"
        :bucket-item-ids="ids"
        :show-equipped="index === 0"
        v-bind="$attrs"
        v-on="$listeners"
      />
    </div>
  </li>
</template>

<script>
import ItemManagerBucket from 'components/ItemManagerBucket';

export default {
  name: 'ItemManagerSplitBucket',
  components: {
    ItemManagerBucket,
  },
  inheritAttrs: false,
  props: {
    buckets: {
      type: Array,
      required: false,
      default: () => [],
    },
    expanded: {
      type: Boolean,
      required: false,
      default: false,
    },
    hash: {
      type: [String, Number],
      required: true,
    },
    itemCapacity: {
      type: String,
      required: false,
      default: '',
    },
    name: {
      type: String,
      required: false,
      default: 'Unknown',
    },
  },
  computed: {
    classes() {
      return [
        this.$style.bucket,
        {
          [this.$style.expanded]: this.expanded,
        },
      ];
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.bucket {
  position: relative;

  display: grid;
  grid-template-columns: minmax(
    calc(
      (var(--item-size) + var(--item-spacing) * 2) * 4
      + #{$bucket-margin-right}
      + #{$bucket-margin-left}
      + 4px * 2
      + var(--item-equipped-separation)
      + 2px
    ),
    30%
  ) minmax(30px, 1fr);
  grid-template-areas: 'name      name'
                       'inventory stored';
  grid-auto-rows: min-content;

  width: 100%;

  opacity: 0.66;
  border: 1px solid $bg-white-accent;
  border-radius: $border-radius;
  background-color: $bg-white;

  transition-property: opacity, background-color, box-shadow;
  transition-duration: 225ms;
  transition-timing-function: $standard-curve;

  & + & { margin-top: 8px; }

  &:hover,
  &.expanded {
    background-color: $bg-white;
  }

  &.expanded {
    opacity: 0.9;
    transition-property: opacity, background-color, box-shadow, border-color;
  }

  &:hover {
    opacity: 1;
    box-shadow: 0 1px 6px rgba(15, 15, 15, 0.08);
  }
}

.expanded {
  &:before {
    content: '';

    position: absolute;
    right: 3px;

    grid-area: stored;

    width: 13px;
    height: 100%;

    pointer-events: none;

    background-image: linear-gradient(to left, $bg-white, transparentize($bg-gray, 0.75));
  }

  &:after {
    content: '';

    grid-area: stored;

    width: calc(100% - 16px);
    height: 100%;

    pointer-events: none;

    border-left: 1px solid $bg-white-accent;
    background-color: transparentize($bg-gray, 0.75);
  }
}

.character { grid-area: inventory; }
.storage { grid-area: stored; }

.name {
  position: relative;

  display: flex;
  align-items: center;

  grid-area: name;

  margin: 0 8px;
  padding: 8px 0;

  user-select: none;
  text-align: left;

  cursor: pointer;
  appearance: none;

  outline: none;
  border: 1px solid transparent;
  background-color: transparent;

  .expanded & {
    color: $fg-black;
    border-bottom-color: $bg-white-accent;
  }
}

.arrow {
  position: relative;
  z-index: 2;

  margin-right: 4px;
  margin-left: auto;

  opacity: 0.25;
  fill: $bg-black;

  transform: rotateZ(180deg);

  transition: opacity 225ms $standard-curve;

  .expanded & { transform: rotateZ(0); }

  .name:hover & { opacity: 0.5; }
}
</style>
