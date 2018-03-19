const mutations = {
  // root
  SET_USER_ID: 'SET_USER_ID',
  SET_USER_MEMBERSHIPS: 'SET_USER_MEMBERSHIPS',
  SET_PROGRESS: 'SET_PROGRESS',

  // settings
  SET_LANGUAGE: 'SET_LANGUAGE',
  SET_ITEM_SIZE: 'SET_ITEM_SIZE',
  SET_ITEM_SPACING: 'SET_ITEM_SPACING',

  // membership
  SET_ID: 'SET_ID',
  SET_PLATFORM_TYPE: 'SET_PLATFORM_TYPE',
  SET_CHARACTER: 'SET_CHARACTER',
  SET_VAULT: 'SET_VAULT',
  SET_ACTIVE_CHARACTER: 'SET_ACTIVE_CHARACTER',
  SET_ITEM_INSTANCES: 'SET_ITEM_INSTANCES',
  SET_CHARACTER_ITEM_IDS: 'SET_CHARACTER_ITEM_IDS',
  SET_ACCOUNT_ITEM_IDS: 'SET_ACCOUNT_ITEM_IDS',
  SET_INSPECTED_ITEM_ID: 'SET_INSPECTED_ITEM_ID',
  SET_SELECTED_ITEM_ID: 'SET_SELECTED_ITEM_ID',
  RESET: 'RESET',
  SET_SEARCH_QUERY: 'SET_SEARCH_QUERY',
  SET_SEARCH_ACTIVE: 'SET_SEARCH_ACTIVE',
  SET_STORAGE_TYPE: 'SET_STORAGE_TYPE',
  SET_DEFINITIONS: 'SET_DEFINITIONS',
};

const actions = {
  // membership
  GET_DEFINITIONS: 'GET_DEFINITIONS',
  FETCH_PROFILE: 'FETCH_PROFILE',
  PROCESS_CHARACTERS: 'PROCESS_CHARACTERS',
  PROCESS_INVENTORY: 'PROCESS_INVENTORY',
};

const Types = {
  ...mutations,
  ...actions,
};

export { Types as default };
