import _ from 'lodash';

import Identifiers from 'B.Net/Identifiers';

async function getCandidateStacks(targetHash, itemIds, itemInstances, definitions) {
  const candidates = itemIds.map(async (itemId) => {
    const candidate = itemInstances[itemId];
    if (candidate && candidate.itemHash === targetHash) {
      const candidateDef = await definitions.InventoryItem[candidate.itemHash];
      const { inventory: { maxStackSize: candidateMax = -1 } } = candidateDef;
      if (candidate.quantity < candidateMax) {
        return [candidate, candidateMax];
      }
    }
    return null;
  });

  return (await Promise.all(candidates)).filter(Boolean);
}

async function handleTransfer({ state, commit }, payload) {
  const { accountItemIds, characterItemIds, itemInstances } = state;
  const {
    from,
    to,
    itemId,
    quantity,
  } = payload;

  const originalItem = itemInstances[itemId];
  const transferredAmount = Number(quantity);
  let targetItem;
  // move the whole target to new location
  if (originalItem.quantity === transferredAmount) {
    targetItem = originalItem;
    commit('REMOVE_ITEM_ID', {
      itemId,
      owner: originalItem.owner,
    });
  // create a copy and leave the original
  } else if (originalItem.quantity > transferredAmount) {
    targetItem = _.cloneDeep(originalItem);
    let { id: copiedItemId } = targetItem;
    if (copiedItemId.startsWith('item_')) {
      copiedItemId = _.uniqueId('item_');
      targetItem.id = copiedItemId;
    } else {
      throw new Error('Missing item id / Split instanced item');
    }

    commit('ADD_ITEM_INSTANCES', { [copiedItemId]: targetItem });

    commit('UPDATE_ITEM', {
      itemId: targetItem.id,
      prop: 'quantity',
      value: transferredAmount,
    });
    commit('UPDATE_ITEM', {
      itemId: originalItem.id,
      prop: 'quantity',
      value: originalItem.quantity - transferredAmount,
    });
  }

  let destination = to;
  if (targetItem.bucket.scope === 1 && from === Identifiers.VAULT) {
    destination = 'account';
  }

  const definitions = await state.definitions;
  const itemDef = await definitions.InventoryItem[originalItem.itemHash];
  const { inventory: { maxStackSize } } = itemDef;
  // full stack.
  if (maxStackSize === transferredAmount) {
    commit('ADD_ITEM_ID', {
      itemId: targetItem.id,
      owner: destination,
    });
  // not a full stack. can saturate another stack.
  } else if (maxStackSize > transferredAmount) {
    const desinationIds = destination === 'account' ?
      accountItemIds :
      characterItemIds[destination];
    const [candidate] = await getCandidateStacks(
      targetItem.itemHash,
      desinationIds,
      itemInstances,
      definitions,
    );

    if (!candidate) {
      commit('ADD_ITEM_ID', {
        itemId: targetItem.id,
        owner: destination,
      });
    } else {
      const [candidateItem, candidateMax] = candidate;
      const overflowAmount = (candidateItem.quantity + transferredAmount) - candidateMax;
      commit('UPDATE_ITEM', {
        itemId: candidateItem.id,
        prop: 'quantity',
        value: Math.min(candidateMax, candidateItem.quantity + transferredAmount),
      });
      if (overflowAmount > 0) {
        commit('UPDATE_ITEM', {
          itemId: targetItem.id,
          prop: 'quantity',
          value: overflowAmount,
        });
        commit('ADD_ITEM_ID', {
          itemId: targetItem.id,
          owner: destination,
        });
      } else {
        commit('REMOVE_ITEM_INSTANCES', [targetItem.id]);
      }
    }
  }
}

export { handleTransfer as default };
