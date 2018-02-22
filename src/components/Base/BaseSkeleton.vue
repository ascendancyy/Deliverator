<template>
  <div :class="[$style.skeleton, { [$style.active]: active }]" />
</template>

<script>
export default {
  name: 'BaseSkeleton',
  props: {
    active: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

@keyframes swipe {
  0% { transform: translateX(-150%); }
  100% { transform: translateX(150%); }
}

.skeleton {
  position: relative;

  background-color: $bg-gray;

  overflow: hidden;
  contain: strict;

  &:before {
    content: '';

    position: absolute;
    top: -15%;
    right: -15%;
    bottom: -15%;
    left: -15%;
    z-index: 1;

    opacity: 0.15;
    visibility: hidden;
    background-image: linear-gradient(
      to right,
      transparent 0%,
      $bg-white 50%,
      transparent 100%
    );

    animation: swipe 1500ms linear;
    animation-delay: inherit;
    animation-iteration-count: infinite;
    animation-fill-mode: both;
    animation-play-state: paused;
  }

  &.active:before {
    visibility: visible;
    animation-play-state: running;
  }
}
</style>
