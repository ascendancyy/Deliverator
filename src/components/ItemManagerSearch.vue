<template>
  <div
    :class="[$style.search, { [$style.active]: searchFocus || query }]"
    @keyup.esc="clear">
    <div
      v-show="!query || searchActive"
      :class="$style.placeholder">
      Search
    </div>

    <input
      ref="editor"
      v-model="query"
      aria-label="Search"
      tabindex="0"
      type="text"
      :class="$style.editor"
      @focus="searchFocus = true"
      @blur="searchFocus = false"
    >

    <transition
      :enter-class="$style.cancelEnter"
      :enter-active-class="$style.cancelEnterActive"
      :leave-active-class="$style.cancelLeaveActive"
      :leave-to-class="$style.cancelLeaveTo">
      <BaseIcon
        v-show="!(query === '')"
        glyph="cancel"
        :size="26"
        :class="$style.cancel"
        @click="clear"
      />
    </transition>
  </div>
</template>

<script>
import _ from 'lodash';
import { mapState } from 'vuex';

export default {
  name: 'ItemManagerSearch',
  data() {
    return {
      searchFocus: false,
      query: '',
    };
  },
  computed: mapState('activeMembership', ['searchActive']),
  watch: {
    query(newQuery) {
      const emptyQuery = newQuery === '';
      if (!emptyQuery && !this.searchActive) {
        this.$store.commit('activeMembership/SET_SEARCH_ACTIVE', true);
      }

      this.debounceQuery(this.query);

      if (emptyQuery) {
        this.$store.commit('activeMembership/SET_SEARCH_ACTIVE', false);
      }
    },
  },
  methods: {
    debounceQuery: _.debounce(function debouncedQuery(query) {
      this.$store.commit('activeMembership/SET_SEARCH_QUERY', query);
    }, 144, { leading: true, trailing: true }),

    clear() {
      this.query = '';
      this.$refs.editor.blur();
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.search {
  position: relative;

  grid-area: primary;

  border: 1px solid $bg-white-accent;
  border-radius: $border-radius;
  background-color: $bg-white;

  transition: all 225ms $standard-curve;

  &:hover,
  &:focus,
  &.active {
    border-color: lighten($bg-white-accent, 2%);
    border-bottom-color: $bg-focus-accent;
    background-color: lighten($bg-white, 2%);
  }

  &:hover { box-shadow: 0 1px 5px transparentize($bg-focus, 0.75); }
}

.placeholder {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;

  display: flex;
  align-items: center;

  height: 100%;
  padding-left: 8px;

  user-select: none;

  opacity: 0.5;

  transition-property: font-size, opacity, transform;
  transition-duration: 225ms;
  transition-timing-function: $standard-curve;

  .active & {
    font-size: 85%;
    opacity: 0.5;
    transform: translateY(100%) translateX(-8px);
  }
}

.editor {
  position: relative;
  z-index: 1;

  width: 100%;
  padding-right: calc(8px * 2 + 12px);
  padding-left: 8px;

  font-family: Cabin, sans-serif;
  line-height: 28px;
  word-spacing: 0;
  letter-spacing: 0;

  appearance: none;
  outline: none;

  border: 0;
  background-color: transparent;

  body:not(:global .main-font-loaded) & {
    font-family: sans-serif;
    word-spacing: -0.2px;
    letter-spacing: -0.35px;
  }
}

.cancel {
  position: absolute;
  top: 50%;
  right: 1px;
  z-index: 2;

  display: flex;
  align-items: center;

  padding: 8px;

  cursor: pointer;

  fill: transparentize($bg-black, 0.5);

  transform: translateY(-50%);

  &:hover { fill: transparentize($bg-black, 0.25); }
}

.cancelEnterActive,
.cancelLeaveActive {
  transition-property: opacity, transform;
  transition-duration: 225ms;
}

.cancelEnterActive { transition-timing-function: $deceleration-curve; }
.cancelLeaveActive { transition-timing-function: $acceleration-curve; }

.cancelEnter,
.cancelLeaveTo {
  opacity: 0;
  transform: translateY(-50%) scale(0.75);
}

</style>
