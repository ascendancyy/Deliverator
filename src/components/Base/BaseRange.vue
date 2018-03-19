<template>
  <input
    :value="value"
    :min="min"
    :max="max"
    :class="$style.range"
    type="range"
    @input="$emit('input', $event.target.value)"
  >
</template>

<script>
export default {
  name: 'BaseRange',
  props: {
    min: {
      type: Number,
      required: false,
    },
    max: {
      type: Number,
      required: false,
    },
    value: {
      type: Number,
      required: false,
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

$range-track-height: 5px;
$range-thumb-size: 12px;

.range {
  position: relative;

  margin-top: -2px;
  width: 100%;
  padding: 4px 0;

  cursor: pointer;

  appearance: none;
  background-color: transparent;

  &:focus { outline: none; }

  &:hover::-webkit-slider-thumb {
    border-color: $bg-primary-accent;
    background-color: $bg-primary;
  }

  &:hover::-moz-range-thumb {
    border-color: $bg-primary-accent;
    background-color: $bg-primary;
  }

  &:hover::-ms-thumb {
    border-color: $bg-primary-accent;
    background-color: $bg-primary;
  }
}

// stylelint-disable-next-line no-descending-specificity
.range::-webkit-slider-runnable-track {
  width: 100%;
  height: $range-track-height;

  border: 1px solid $bg-gray-accent;
  border-radius: $border-radius;
  background-color: $bg-gray;
}

.range:focus::-webkit-slider-runnable-track { border-color: $bg-focus-accent; }

// stylelint-disable-next-line no-descending-specificity
.range::-webkit-slider-thumb {
  margin-top: -5px;
  width: $range-thumb-size;
  height: $range-thumb-size;

  cursor: pointer;
  appearance: none;

  border: 1px solid $bg-white-accent;
  border-radius: 50%;
  background-color: $bg-white;
  box-shadow: 0 1px 4px -1px $shadow-color,
              0 2px 1px -1px $shadow-color;

  transition: border-color 225ms $standard-curve,
              background-color 225ms $standard-curve;

  &:hover,
  &:active {
    border-color: $bg-focus-accent;
    background-color: $bg-focus;
  }
}

// stylelint-disable-next-line no-descending-specificity
.range::-moz-range-track {
  width: 100%;
  height: $range-track-height;

  cursor: pointer;

  border: 1px solid $bg-gray-accent;
  border-radius: $border-radius;
  background-color: $bg-gray;
}

.range:focus::-moz-range-track { border-color: $bg-focus-accent; }

// stylelint-disable-next-line no-descending-specificity
.range::-moz-range-progress {
  height: $range-track-height;

  cursor: pointer;
  pointer-events: none;

  border-radius: $border-radius;
  background-color: $bg-white;
}

// stylelint-disable-next-line no-descending-specificity
.range::-moz-range-thumb {
  width: $range-thumb-size;
  height: $range-thumb-size;

  cursor: pointer;

  border: 1px solid $bg-white-accent;
  border-radius: 50%;
  background-color: $bg-white;
  box-shadow: 0 1px 4px -1px $shadow-color,
              0 2px 1px -1px $shadow-color;

  transition: border-color 225ms $standard-curve,
              background-color 225ms $standard-curve;

  &:hover,
  &:active {
    border-color: $bg-focus-accent;
    background-color: $bg-focus;
  }
}

// stylelint-disable-next-line no-descending-specificity
.range::-ms-track {
  width: 100%;
  height: $range-track-height;

  color: transparent;

  cursor: pointer;

  border-color: transparent;
  background-color: transparent;
}

/* stylelint-disable no-descending-specificity */
.range::-ms-fill-lower,
.range::-ms-fill-upper {
  /* stylelint-enable no-descending-specificity */
  border: 1px solid $bg-gray-accent;
  transition: border-color 225ms $standard-curve;
}

// stylelint-disable-next-line no-descending-specificity
.range::-ms-fill-lower {
  border-top-left-radius: $border-radius;
  border-bottom-left-radius: $border-radius;
  background-color: $bg-white;
}

// stylelint-disable-next-line no-descending-specificity
.range::-ms-fill-upper {
  border-top-right-radius: $border-radius;
  border-bottom-right-radius: $border-radius;
  background-color: $bg-gray;
}

.range:focus::-ms-fill-lower,
.range:focus::-ms-fill-upper {
  border-color: $bg-focus-accent;
}

// stylelint-disable-next-line no-descending-specificity
.range::-ms-thumb {
  margin-top: -1px;
  width: $range-thumb-size;
  height: $range-thumb-size;

  cursor: pointer;

  border: 1px solid $bg-white-accent;
  border-radius: 50%;
  background-color: $bg-white;
  box-shadow: 0 1px 4px -1px $shadow-color,
              0 2px 1px -1px $shadow-color;

  transition: border-color 225ms $standard-curve,
              background-color 225ms $standard-curve;

  &:hover,
  &:active {
    border-color: $bg-focus-accent;
    background-color: $bg-focus;
  }
}
</style>
