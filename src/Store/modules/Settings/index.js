import Storage from 'src/Storage';
import Types from 'Store/Types';

const {
  SET_LANGUAGE,
  SET_ITEM_SIZE,
  SET_ITEM_SPACING,
} = Types;

const { language = 'en', item } = Storage.get('deliverator:settings') || {};
const { size: itemSize = 44, spacing: itemSpacing = 2 } = item || {};

document.addEventListener('DOMContentLoaded', function applySettings() {
  document.removeEventListener('DOMContentLoaded', applySettings, true);
  document.documentElement.lang = language;
  document.documentElement.style.setProperty('--item-size', `${itemSize}px`);
  document.documentElement.style.setProperty('--item-spacing', `${itemSpacing}px`);
}, true);

const state = {
  language,

  item: {
    size: itemSize,
    spacing: itemSpacing,
  },
};

const mutations = {
  [SET_LANGUAGE]: function setLanguage(state, language) {
    state.language = language;
    document.documentElement.lang = language;
    Storage.set('deliverator:settings', state);
  },
  [SET_ITEM_SIZE]: function setItemSize(state, size) {
    state.item.size = size;
    document.documentElement.style.setProperty('--item-size', `${size}px`);
    Storage.set('deliverator:settings', state);
  },
  [SET_ITEM_SPACING]: function setItemSpacing(state, spacing) {
    state.item.spacing = spacing;
    document.documentElement.style.setProperty('--item-spacing', `${spacing}px`);
    Storage.set('deliverator:settings', state);
  },
};

const Settings = {
  namespaced: true,
  state,
  mutations,
};

export { Settings as default };
