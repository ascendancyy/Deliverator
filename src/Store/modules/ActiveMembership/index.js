import Vue from 'vue';
import _ from 'lodash';

import Paths from 'B.Net/Paths';
import Identifiers from 'B.Net/Identifiers';
import Definitions from 'B.Net/Definitions';
import retrieveManifest from 'B.Net/retrieveManifest';
import getViableProfile from 'B.Net/getViableProfile';
import BucketMetadata from 'B.Net/metadata/BucketMetadata';

import processCharacter from 'Store/modules/ActiveMembership/processCharacter';
import processItem from 'Store/modules/ActiveMembership/processItem';

import Storage from 'src/Storage';
import { prefixURL } from 'src/utils';

import Types from 'Store/Types';

const {
  // mutations
  SET_ID,
  SET_NAME,
  SET_PLATFORM,
  SET_VAULT,
  SET_ACCOUNT_ITEMS,
  SET_ITEMS,
  SET_CHARACTER,
  SET_ACTIVE_CHARACTER,
  SET_STORAGE_TYPE,
  RESET,
  SET_SEARCH_QUERY,
  SET_SEARCH_ACTIVE,

  // actions
  FETCH_PROFILE,
  PROCESS_PROFILE,
  GET_DEFINITIONS,
  PROCESS_CHARACTERS,
  PROCESS_INVENTORIES,
  PROCESS_PROFILE_INVENTORY,
  PROCESS_CHARACTERS_INVENTORIES,
  // SET_CHARACTER
} = Types;

const state = {
  id: null,
  name: null,
  platform: null,

  activeCharacterId: Storage.get('deliverator:activeCharacterId', 'session') || null,
  characters: {},
  vault: {},

  items: {},
  accountItems: [],

  searchQuery: '',
  searchActive: false,

  storageType: Storage.get('deliverator:storageType') || 'all',
  progress: -1,
};

function bucketColumn(index, items, filter) {
  const buckets = {};
  _.forEach(items, (item) => {
    const { hidden = false } = BucketMetadata[item.bucket.hash] || {};
    if (
      !item ||
      !item.bucket.enabled ||
      item.bucket.redacted ||
      (filter && filter.includes(item.bucket.hash)) ||
      hidden
    ) {
      if (process.env.NODE_ENV !== 'production') {
        if (!item.bucket.enabled) {
          console.log('Disabled Bucket:', item);
        } else if (item.bucket.redacted) {
          console.log('Redacted Bucket:', item);
        }
      }
      return;
    }

    let key = _.findKey(buckets, bucket => bucket.hash === item.bucket.hash);
    if (!key) {
      const bucket = { ...item.bucket };
      bucket.index = index;
      bucket.items = [];

      key = bucket.hash in BucketMetadata ?
        BucketMetadata[bucket.hash].order :
        bucket.hash;

      buckets[key] = bucket;
    }

    buckets[key].items.push(item);
  });

  return buckets;
}

const getters = {
  sortedCharacters({ characters }) {
    return Object.values(characters).sort((c1, c2) => {
      const d1 = new Date(c1.dateLastPlayed);
      const d2 = new Date(c2.dateLastPlayed);

      if (d1 === d2) { return 0; }
      return d1 > d2 ? -1 : 1;
    });
  },
  activeItems({ activeCharacterId, items, accountItems }) {
    const characterItems = items[activeCharacterId] || [];
    return [...characterItems, ...accountItems];
  },
  inactiveItems({ activeCharacterId, items, storageType }) {
    return storageType === 'all' ?
      _.omit(items, activeCharacterId) :
      _.pick(items, storageType);
  },
  storageItems(store, getters) {
    const storages = Object.values(getters.inactiveItems);
    return storages.reduceRight((acc, items) => [...acc, ...items], []);
  },
  buckets(store, getters) {
    const items = [getters.activeItems, getters.storageItems];
    const bucketColumns = items.map((value, index) => (
      index === 0 ?
        bucketColumn(index, value) :
        bucketColumn(index, value, [Identifiers.BUCKET_BUILD])
    ));

    const matrix = {};
    const ranks = _.union(...bucketColumns.map(Object.keys));
    ranks.forEach((rank) => {
      const bucketRow = bucketColumns.map(b => b[rank]).filter(Boolean);
      const bucket = bucketRow[0];

      if (!bucket.displayProperties.name) {
        return;
      }

      const name = _.get(bucket, ['displayProperties', 'name'], 'Unknown');
      const identifier = bucket.hash;

      matrix[rank] = {
        name,
        identifier,
        buckets: bucketRow,
      };
    });

    return matrix;
  },
  hasBuckets(store, getters) {
    return Object.keys(getters.buckets).length > 0;
  },
};

const mutations = {
  [SET_ID]: function setName(state, id) {
    state.id = id;
  },
  [SET_NAME]: function setName(state, name) {
    state.name = name;
  },
  [SET_PLATFORM]: function setName(state, platform) {
    state.platform = platform;
    Storage.set('B.Net:destinyMembershipType', platform);
  },

  [SET_VAULT]: function setName(state, vault) {
    state.vault = vault;
  },
  [SET_ACCOUNT_ITEMS]: function setAccountItems(state, items) {
    state.accountItems = items;
  },
  [SET_ITEMS]: function addItems(state, { owner, items }) {
    Vue.set(state.items, owner, items);
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

  [SET_STORAGE_TYPE]: function setStorageType(state, type) {
    state.storageType = type;
    Storage.set('deliverator:storageType', type);
  },

  [RESET]: function setCharacters() {
    state.id = null;
    state.name = null;
    state.platform = null;
    state.items = {};
    state.characters = {};

    Storage.remove('B.Net:destinyMembershipType');
  },

  [SET_SEARCH_QUERY]: function setSearchQuery(state, query) {
    state.searchQuery = query;
  },
  [SET_SEARCH_ACTIVE]: function setSearchActive(state, active) {
    state.searchActive = active;
  },
};

const actions = {
  [FETCH_PROFILE]: async function fetchProfile({
    state,
    rootState,
    commit,
    dispatch,
  }) {
    const type = state.platform;
    const activeMembership = type ?
      _.find(rootState.user.destinyMemberships, { membershipType: type }) :
      rootState.user.destinyMemberships;
    const profile = await getViableProfile(activeMembership);
    const { profile: { data: { userInfo } } } = profile;

    commit(SET_ID, userInfo.membershipId);
    commit(SET_NAME, userInfo.displayName);
    commit(SET_PLATFORM, userInfo.membershipType);

    await dispatch(PROCESS_PROFILE, profile);
  },
  [PROCESS_PROFILE]: async function processProfile({ commit, dispatch }, profile) {
    const {
      profileInventory: { data: profileInventory },
      characters: { data: characters },
      characterInventories: { data: characterInventories },
      characterEquipment: { data: characterEquipment },
      itemComponents,
    } = profile;

    const definitions = await dispatch(GET_DEFINITIONS);

    const processCharacters = dispatch(PROCESS_CHARACTERS, { characters, definitions });
    const [profInv, charInvs] = await dispatch(PROCESS_INVENTORIES, {
      charactersIds: Object.keys(characters),
      profileInventory,
      characterInventories,
      characterEquipment,
      itemComponents,
      definitions,
    });
    const [accountItems, vaultItems] = _.partition(profInv, { owner: 'account' });
    commit(SET_ACCOUNT_ITEMS, accountItems);
    commit(SET_ITEMS, { owner: Identifiers.VAULT, items: vaultItems });

    charInvs.forEach(async ({ id, items }) => commit(SET_ITEMS, { owner: id, items: await items }));

    const { displayProperties: { name, icon } } = await definitions.Vendor[Identifiers.VAULT];
    commit(SET_VAULT, {
      id: Identifiers.VAULT,
      name,
      emblemPath: prefixURL(icon, Paths.BASE),
    });

    return Promise.all((await processCharacters)
      .map(character => dispatch(SET_CHARACTER, character)));
  },
  [GET_DEFINITIONS]: async function getDefinitions({ rootState, commit }) {
    const manifest = retrieveManifest(
      rootState.settings.language,
      (progress) => { commit('SET_PROGRESS', progress, { root: true }); },
    );
    return Definitions.retrieve(rootState.settings.language, await manifest);
  },
  [PROCESS_CHARACTERS]: function processCharacters(context, { definitions, characters }) {
    const processor = character => processCharacter({ definitions, character });
    return Promise.all(Object.values(characters).map(processor));
  },
  [PROCESS_INVENTORIES]: async function processInventories({ dispatch }, {
    charactersIds,
    profileInventory,
    characterInventories,
    characterEquipment,
    itemComponents,
    definitions,
  }) {
    return Promise.all([
      dispatch(PROCESS_PROFILE_INVENTORY, { profileInventory, itemComponents, definitions }),
      dispatch(PROCESS_CHARACTERS_INVENTORIES, {
        charactersIds,
        characterInventories,
        characterEquipment,
        itemComponents,
        definitions,
      }),
    ]);
  },
  [PROCESS_PROFILE_INVENTORY]: async function processProfileInventory(context, {
    profileInventory,
    itemComponents,
    definitions,
  }) {
    const processor = item => processItem({
      definitions,
      components: itemComponents,
      item,
      owner: Identifiers.VAULT,
    });
    return Promise.all(profileInventory.items.map(processor));
  },
  [PROCESS_CHARACTERS_INVENTORIES]: function processCharactersInventories(context, {
    charactersIds,
    characterInventories,
    characterEquipment,
    itemComponents,
    definitions,
  }) {
    return charactersIds.map((id) => {
      const processor = item => processItem({
        definitions,
        components: itemComponents,
        item,
        owner: id,
      });
      const processedItems = [characterInventories, characterEquipment]
        .reduce((acc, inventory) => ([
          ...acc,
          ...((inventory[id] || {}).items || []),
        ]), [])
        .map(processor);

      return { id, items: Promise.all(processedItems) };
    });
  },

  [SET_CHARACTER]: function setCharacter({ state, commit }, character) {
    commit(SET_CHARACTER, character);
    if (!state.activeCharacterId) {
      commit(SET_ACTIVE_CHARACTER, character.id);
    }
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
