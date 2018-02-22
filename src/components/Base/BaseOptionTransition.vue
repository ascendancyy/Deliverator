<template>
  <transition
    :enter-class="$style.optionEnter"
    :enter-active-class="$style.optionEnterActive"
    :leave-active-class="$style.optionLeaveActive"
    :leave-to-class="$style.optionLeaveTo"
    @before-enter="setTransitionDelay"
    @after-enter="removeTransitionDelay"
    @enter-cancelled="removeTransitionDelay"
    @before-leave="setTransitionDelay"
    @after-leave="removeTransitionDelay"
    @leave-cancelled="removeTransitionDelay">
    <slot />
  </transition>
</template>

<script>
export default {
  name: 'BaseOptionTransition',
  methods: {
    setTransitionDelay: function setTransitionDelay(el) {
      const { index } = el.dataset;
      if (!index) {
        return;
      }
      el.style.transitionDelay = `${(index * 30) + 130}ms`;
    },
    removeTransitionDelay: function removeTransitionDelay(el) {
      el.style.transitionDelay = '';
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.optionEnterActive {
  transition-property: opacity, transform;
  transition-duration: 225ms;
  transition-timing-function: $deceleration-curve;
}

.optionLeaveActive {
  transition: opacity 225ms $standard-curve;
}

.optionEnter,
.optionLeaveTo {
  opacity: 0;
}

.optionEnter { transform: translateY(4px); }
</style>
