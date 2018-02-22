<template>
  <div :class="$style.bucket">
    <div :class="$style.content">
      <div
        v-if="(showEquipped && splitBucket.equippedItem) || loading"
        :class="$style.equipped">
        <ItemManagerItem
          :item="splitBucket.equippedItem"
          v-bind="$attrs"
          v-on="$listeners"
        />
      </div>

      <ul
        v-if="splitBucket.unequippedItems || loading"
        :class="$style.items">
        <li
          v-for="item in splitBucket.unequippedItems"
          :key="item.id">
          <ItemManagerItem
            :item="item"
            v-bind="$attrs"
            v-on="$listeners"
          />
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';

import ItemManagerItem from 'components/ItemManagerItem';

export default {
  name: 'ItemManagerBucket',
  components: {
    ItemManagerItem,
  },
  inheritAttrs: false,
  props: {
    bucket: {
      type: Object,
      required: false,
    },
    loading: {
      type: Boolean,
      required: false,
    },
    showEquipped: {
      type: Boolean,
      required: false,
      default: true,
    },
  },
  computed: {
    splitBucket() {
      const splitBucket = {
        equippedItem: undefined,
        unequippedItems: undefined,
      };

      if (this.bucket) {
        const bucketItems = this.bucket.items;
        splitBucket.unequippedItems = bucketItems;

        if (this.showEquipped) {
          // eslint-disable-next-line no-bitwise
          const split = _.partition(bucketItems, item => item.transferStatus & 1);
          [[splitBucket.equippedItem], splitBucket.unequippedItems] = split;
        }
      }

      return splitBucket;
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.bucket {
  position: relative;

  margin: 4px;
  border: 1px solid transparent;
}

.content {
  position: relative;
  z-index: 1;

  display: flex;
  align-items: flex-start;

  margin: 4px;
}

.equipped {
  position: relative;
  margin-right: var(--item-equipped-separation);
}

.items {
  display: flex;
  justify-content: flex-start;
  align-items: stretch;
  flex-wrap: wrap;
}
</style>
