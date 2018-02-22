<template>
  <BaseOptionTransition>
    <div
      v-show="option.visible"
      :data-index="option.index"
      role="option"
      :aria-selected="option.selected"
      :class="[
        $style.option,
        {
          [$style.optionDisabled]: option.disabled,
          [$style.optionFocused]: option.focused,
          [$style.optionSelected]: option.selected,
          [$style.optionPending]: option.pending,
        },
    ]">
      <slot />
    </div>
  </BaseOptionTransition>
</template>


<script>
export default {
  name: 'BaseOption',
  props: {
    option: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

@keyframes option-pulse {
  0% { transform: scale(0, 0); }
  10% { opacity: 0.9; }

  100% {
    opacity: 0;
    transform: scale(3, 3);
  }
}

.option {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 8px;

  overflow: hidden;

  transition: padding-left 225ms $standard-curve;

  will-change: transform;

  &:before,
  &:after {
    content: '';

    position: absolute;
    top: calc(50% - 4px);
    left: 8px;

    width: 8px;
    height: 8px;

    border-radius: 50%;
    background-color: transparent;
  }

  &:before {
    opacity: 0;
    border: 1px solid $bg-focus-accent;

    transform: scale(0.33);

    transition-property: opacity, background-color, transform;
    transition-duration: 225ms;
    transition-timing-function: $standard-curve;
  }

  &:after {
    visibility: hidden;

    border: 1px solid transparentize($bg-focus-accent, 0.33);
    transform: scale(0);

    transition: background-color 225ms $standard-curve;

    animation-name: option-pulse;
    animation-duration: 888ms;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
  }

  &.optionSelected:before { background-color: $bg-focus; }

  &.optionPending:before,
  &.optionSelected:before {
    opacity: 1;
    transform: scale(1);
  }

  &.optionPending,
  &.optionPending:active,
  &.optionSelected,
  &.optionSelected:active {
    padding-left: calc(8px * 3);
  }
}

.optionPending {
  cursor: default;

  &:after { visibility: visible; }

  &:before,
  &:after {
    background-color: $warning-color;
  }
}
</style>

