<template>
  <div :class="$style.itemManager">
    <transition
      :enter-class="$style.loadingEnter"
      :enter-active-class="$style.loadingEnterActive"
      :leave-active-class="$style.loadingLeaveActive"
      :leave-to-class="$style.loadingLeaveTo">
      <ul
        v-show="hasItems"
        :class="$style.items">
        <ItemManagerSplitBucket
          v-for="bucket in bucketGroups"
          :key="bucket.hash"
          :buckets="bucket.group"
          :expanded="expanded[bucket.hash]"
          :item-capacity="itemCapacity(bucket)"
          :hash="bucket.hash"
          :name="bucket.displayProperties.name"
          :scroll-root="scrollRoot"
          v-on="$listeners"
          @toggle="expand => $set(expanded, bucket.hash, !expanded[bucket.hash])"
        />
      </ul>
    </transition>
    <div
      v-if="!hasItems"
      key="loading"
      :class="$style.loading">
      <div :class="$style.loader">
        <BaseIcon
          glyph="ghost"
          :class="$style.ghost"
        />
      </div>
      <span :class="$style.message">Loading . . .</span>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import BucketMetadata from 'B.Net/metadata/BucketMetadata';

import ItemManagerSplitBucket from 'components/ItemManagerSplitBucket';

export default {
  name: 'ItemManager',
  components: {
    ItemManagerSplitBucket,
  },
  data() {
    const expanded = Object.create(null);

    Object.values(BucketMetadata).forEach((bucket) => {
      if (bucket.expand) {
        expanded[bucket.hash] = true;
      }
    });

    return { expanded, scrollRoot: null };
  },
  computed: {
    ...mapGetters('activeMembership', [
      'hasItems',
      'bucketGroups',
    ]),
  },
  mounted() { this.scrollRoot = this.$el.querySelector(`.${this.$style.items}`); },
  methods: {
    itemCapacity(bucket) {
      const [activeBucket] = bucket.group;
      if (activeBucket.length <= 0) {
        return '';
      }

      const max = bucket.itemCount;
      return max > 0 ? `(${activeBucket.length}/${max})` : '';
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

@keyframes float {
  0%,
  100% {
    opacity: 0.5;
    transform: translateY(0);
  }

  50% {
    opacity: 0.4;
    transform: translateY(-20%);
  }
}

@keyframes fade {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.4;
  }
}

.itemManager {
  position: relative;
  z-index: 0;

  grid-area: content;
  height: calc(100vh - 80px);

  background-color: $bg-gray;
  overflow: hidden;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;

  height: 100%;
}

.message {
  font-size: $font-scale-3;
  opacity: 0.5;
}

.loader:after,
.ghost {
  animation-duration: 2222ms;
  animation-timing-function: $standard-curve;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
}

.loader {
  position: relative;

  margin: 16px;

  &:after {
    content: '';

    position: absolute;
    bottom: -4px;
    left: 6px;
    z-index: 1;

    width: 36px;
    height: 3px;

    opacity: 0.5;
    border-radius: 25%;
    background-color: $bg-black;

    filter: blur(4px);
    transform: scaleY(0.66);

    animation-name: fade;
  }
}

.ghost {
  width: 48px;
  height: 48px;

  fill: $fg-black;

  animation-name: float;
  will-change: transform;
}

.items {
  height: 100%;
  padding: 8px;

  overflow-x: hidden;
  overflow-y: auto;
}

.loadingEnterActive,
.loadingLeaveActive {
  transition-property: opacity;
  transition-duration: 255ms;
}

.loadingLeaveActive { transition-timing-function: $acceleration-curve; }
.loadingEnterActive { transition-timing-function: $deceleration-curve; }

.loadingEnter,
.loadingLeaveTo {
  opacity: 0;
}
</style>
