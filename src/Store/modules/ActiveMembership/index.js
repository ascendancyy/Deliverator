import _ from 'lodash';
import Vue from 'vue';

import Paths from 'B.Net/Paths';
import Identifiers from 'B.Net/Identifiers';
import Definitions from 'B.Net/Definitions';
import retrieveManifest from 'B.Net/retrieveManifest';
import getViableProfile from 'B.Net/getViableProfile';
import BucketMetadata from 'B.Net/metadata/BucketMetadata';

import processCharacter from 'Store/modules/ActiveMembership/processCharacter';

import Storage from 'src/Storage';
import { prefixURL } from 'src/utils';

import Types from 'Store/Types';

const {
  // mutations
  SET_ID,
  SET_PLATFORM_TYPE,

  SET_CHARACTER,
  SET_VAULT,
  SET_ACTIVE_CHARACTER,

  SET_ITEM_INSTANCES,
  SET_CHARACTER_ITEM_IDS,
  SET_ACCOUNT_ITEM_IDS,
  SET_INSPECTED_ITEM_ID,
  SET_SELECTED_ITEM_ID,
  RESET,

  SET_SEARCH_QUERY,
  SET_SEARCH_ACTIVE,

  SET_STORAGE_TYPE,

  SET_DEFINITIONS,

  // actions
  GET_DEFINITIONS,
  FETCH_PROFILE,
  PROCESS_CHARACTERS,
  PROCESS_INVENTORY,
} = Types;

const buckets = new Map();
const addToBuckets = (item, options) => {
  const { index, filter } = options;
  const { bucket: bucketDef } = item;
  const {
    hash: bucketHash,
    displayProperties: { name },
  } = bucketDef;
  const {
    hidden = false,
    order = bucketHash,
  } = BucketMetadata[bucketHash] || {};
  if (
    !bucketDef.enabled ||
    bucketDef.redacted ||
    !name ||
    hidden ||
    (filter && filter.includes(bucketHash))
  ) {
    return;
  }

  if (!buckets.has(bucketHash)) {
    buckets.set(bucketHash, {
      ...bucketDef,
      order,
      group: [[], []],
    });
  }

  buckets.get(bucketHash).group[index].push(item.id);
};

function emptyBucketItemIds(bucket) {
  // eslint-disable-next-line no-param-reassign
  bucket.group = [[], []];
}

const state = {
  id: null,
  platformType: null,

  activeCharacterId: Storage.get('deliverator:activeCharacterId', 'session') || null,
  characters: {},
  vault: null,

  accountItemIds: [],
  characterItemIds: {},
  itemInstances: {},
  inspectedItemId: -1,
  selectedItemId: -1,

  searchQuery: '',
  searchActive: false,

  storageType: Storage.get('deliverator:storageType') || 'all',

  definitions: null,
};

const getters = {
  activeItemIds(state) {
    const { activeCharacterId, characterItemIds, accountItemIds } = state;
    const { [activeCharacterId]: ids } = characterItemIds;
    if (ids && ids.length > 0) {
      return ids.concat(accountItemIds);
    }
    return accountItemIds;
  },
  inactiveItemIds(state) {
    const { activeCharacterId, characterItemIds, storageType } = state;
    let inactiveItemIds;
    switch (storageType) {
      case 'all': {
        inactiveItemIds = Object.entries(characterItemIds)
          .filter(([characterId]) => characterId !== activeCharacterId)
          .map(([, ids]) => ids)
          .reduceRight((acc, ids) => (acc.concat(ids)), []);
        break;
      }
      default: {
        ({ [storageType]: inactiveItemIds } = characterItemIds);
      }
    }
    return inactiveItemIds || [];
  },
  hasItems(state, getters) {
    const { accountItemIds } = state;
    const { activeItemIds, inactiveItemIds } = getters;
    return (
      accountItemIds.length > 0 ||
      activeItemIds.length > 0 ||
      inactiveItemIds.length > 0
    );
  },
  bucketGroups(state, getters) {
    const { itemInstances } = state;
    const { activeItemIds, inactiveItemIds } = getters;

    const activeItems = activeItemIds.map(id => itemInstances[id]).filter(Boolean);
    const inactiveItems = inactiveItemIds.map(id => itemInstances[id]).filter(Boolean);

    buckets.forEach(emptyBucketItemIds);

    activeItems.map(item => addToBuckets(item, { index: 0 }));
    inactiveItems.map(item => addToBuckets(item, {
      index: 1,
      filter: [Identifiers.BUCKET_BUILD],
    }));

    return [...buckets.values()]
      .filter(({ group: [group1, group2] }) => group1.length > 0 || group2.length > 0)
      .sort((bucket, compare) => {
        const { order: bucketOrder } = bucket;
        const { order: compareOrder } = compare;
        if (bucketOrder === compareOrder) { return 0; }
        return bucketOrder > compareOrder ? 1 : -1;
      });
  },
  sortedCharacters({ characters }) {
    return Object.values(characters).sort((c1, c2) => {
      const d1 = new Date(c1.dateLastPlayed);
      const d2 = new Date(c2.dateLastPlayed);

      if (d1 === d2) { return 0; }
      return d1 > d2 ? -1 : 1;
    });
  },
};

const mutations = {
  [SET_ID]: function setId(state, id) {
    state.id = id;
  },
  [SET_PLATFORM_TYPE]: function setPlatformType(state, platformType) {
    state.platformType = platformType;
    Storage.set('B.Net:destinyMembershipType', platformType);
  },

  [SET_CHARACTER]: function setCharacter(state, character) {
    Vue.set(state.characters, character.id, character);
  },
  [SET_ACTIVE_CHARACTER]: function setActiveCharacter(state, id) {
    state.activeCharacterId = id;
    if (id === state.storageType) {
      state.storageType = 'all';
      Storage.set('deliverator:storageType', 'all');
    }

    Storage.set('deliverator:activeCharacterId', id, 'session');
  },
  [SET_VAULT]: function setVault(state, vault) {
    state.vault = vault;
  },

  [SET_ITEM_INSTANCES]: function setItemInstances(state, itemInstances) {
    state.itemInstances = itemInstances;
  },
  [SET_CHARACTER_ITEM_IDS]: function setCharacterItemIds(state, { owner, itemIds }) {
    Vue.set(state.characterItemIds, owner, itemIds);
  },
  [SET_ACCOUNT_ITEM_IDS]: function setAccountItemIds(state, itemIds) {
    state.accountItemIds = itemIds;
  },
  [SET_INSPECTED_ITEM_ID]: function setInspectedItemId(state, id) {
    state.inspectedItemId = id;
  },
  [SET_SELECTED_ITEM_ID]: function setSelectedItemId(state, id) {
    state.selectedItemId = id;
  },
  [RESET]: function reset() {
    state.id = null;
    state.platformType = null;
    state.characters = {};
    state.accountItemIds = [];
    state.characterItemIds = {};
    state.itemInstances = {};

    Storage.remove('B.Net:destinyMembershipType');
  },

  [SET_SEARCH_QUERY]: function setSearchQuery(state, query) {
    state.searchQuery = query;
  },
  [SET_SEARCH_ACTIVE]: function setSearchActive(state, active) {
    state.searchActive = active;
  },

  [SET_STORAGE_TYPE]: function setStorageType(state, type) {
    state.storageType = type;
    Storage.set('deliverator:storageType', type);
  },

  [SET_DEFINITIONS]: function setDefinitions(state, db) {
    state.definitions = db;
  },
};

const actions = {
  [GET_DEFINITIONS]: async function getDefinitions(context) {
    const {
      rootState: { settings: { language } },
      commit,
    } = context;

    const manifest = retrieveManifest(language);
    const definitions = Definitions.retrieve(language, await manifest);
    commit(SET_DEFINITIONS, definitions);
    return definitions;
  },
  [FETCH_PROFILE]: async function fetchProfile(context, platformType) {
    const {
      state,
      rootState: { user: { destinyMemberships } },
      commit,
      dispatch,
    } = context;

    if (platformType && platformType !== state.platformType) {
      commit(SET_PLATFORM_TYPE, platformType);
    }

    const definitions = dispatch(GET_DEFINITIONS);

    const activeMembership = platformType ?
      destinyMemberships.find(({ membershipType }) => membershipType === platformType) :
      destinyMemberships;
    const {
      profile: { data: { userInfo } },
      profileInventory: { data: { items: profileInventory } },
      characters: { data: characters },
      characterInventories: { data: characterInventories },
      characterEquipment: { data: characterEquipment },
      itemComponents,
    } = await getViableProfile(activeMembership);

    commit(SET_ID, userInfo.membershipId);
    if (platformType) {
      console.assert(platformType === userInfo.membershipType);
    } else {
      commit(SET_PLATFORM_TYPE, userInfo.membershipType);
    }

    return Promise.all([
      dispatch(PROCESS_CHARACTERS, { definitions: await definitions, characters }),
      dispatch(PROCESS_INVENTORY, {
        characterIds: Object.keys(characters),
        profileInventory,
        characterInventories,
        characterEquipment,
        itemComponents,
        definitions: await definitions,
      }),
    ]);
  },
  [PROCESS_CHARACTERS]: async function processCharacters({ commit }, { characters, definitions }) {
    const {
      displayProperties: {
        name,
        icon,
      },
    } = await definitions.Vendor[Identifiers.VAULT];
    commit(SET_VAULT, {
      id: Identifiers.VAULT,
      name,
      emblemPath: prefixURL(icon, Paths.BASE),
    });

    const processor = async character => processCharacter({
      definitions,
      character,
    }).then((character) => {
      if (!state.activeCharacterId) {
        commit(SET_ACTIVE_CHARACTER, character.id);
      }
      commit(SET_CHARACTER, character);
    });

    return Promise.all(Object.values(characters).map(processor));
  },
  [PROCESS_INVENTORY]: async function processInventory({ commit }, payload) {
    const {
      characterIds,
      profileInventory,
      characterInventories,
      characterEquipment,
      itemComponents,
      definitions,
    } = payload;

    const itemInstances = {};
    const add = async (item, owner) => {
      const id = item.itemInstanceId || _.uniqueId('item_');
      const { data: { [item.itemInstanceId]: instance = {} } } = itemComponents.instances;

      const itemDef = await definitions.InventoryItem[item.itemHash];
      const bucketDef = await definitions.InventoryBucket[itemDef.inventory.bucketTypeHash];
      const {
        hash: bucketHash,
        displayProperties: {
          name,
        },
      } = bucketDef;
      const { hidden = false } = BucketMetadata[bucketHash] || {};

      if (
        !bucketDef.enabled ||
        bucketDef.redacted ||
        !name ||
        hidden
      ) {
        return -1;
      }

      itemInstances[id] = {
        ...item,
        ...instance,
        id,
        owner,
        bucket: bucketDef,
        currentBucket: await definitions.InventoryBucket[item.bucketHash],
      };

      return id;
    };

    const [vaultItems, accountItems] = await profileInventory.reduce(async (acc, item) => {
      const itemDef = await definitions.InventoryItem[item.itemHash];
      const bucket = await definitions.InventoryBucket[itemDef.inventory.bucketTypeHash];
      const currentBucket = await definitions.InventoryBucket[item.bucketHash];
      let key = 0;
      let owner = Identifiers.VAULT;
      if (bucket.scope === 1) {
        if (bucket.hash === currentBucket.hash && bucket.location === 0) {
          key = 1;
          owner = 'account';
        }
      }
      (await acc)[key].push(add(item, owner));
      return acc;
    }, Promise.resolve([[], []]));

    commit(SET_ACCOUNT_ITEM_IDS, await Promise.all(accountItems));

    commit(SET_CHARACTER_ITEM_IDS, {
      owner: Identifiers.VAULT,
      itemIds: await Promise.all(vaultItems),
    });

    await Promise.all(characterIds.map(async (owner) => {
      const { [owner]: { items: items1 } } = characterInventories;
      const { [owner]: { items: items2 } } = characterEquipment;

      const ids = Promise.all([
        ...items1.map(item => add(item, owner)),
        ...items2.map(item => add(item, owner)),
      ]);
      commit(SET_CHARACTER_ITEM_IDS, {
        owner,
        itemIds: await ids,
      });

      return ids;
    }));

    commit(SET_ITEM_INSTANCES, itemInstances);
  },
};

const Membership = {
  namespaced: true,
  state,
  getters,
  mutations,
  actions,
};

export { Membership as default };
