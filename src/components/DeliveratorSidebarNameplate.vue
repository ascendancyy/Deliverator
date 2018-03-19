<template>
  <div :class="$style.nameplate">
    <div :style="{ visibility: 'hidden', gridArea: 'emblem' }">
      <CharacterEmblem :src="character.emblemPath" />
    </div>
    <div :class="$style.top">
      <div :class="$style.class">{{ character.class }}</div>
      <div :class="$style.level">{{ character.baseCharacterLevel }}</div>
    </div>
    <div :class="$style.bottom">
      <div :class="$style.race">{{ character.gender }} {{ character.race }}</div>
      <div :class="$style.light">{{ character.light }}</div>
    </div>
    <img
      :src="character.backgroundPath"
      :class="$style.background"
      alt=""
    >
  </div>
</template>

<script>
import CharacterEmblem from 'components/CharacterEmblem';

export default {
  name: 'DeliveratorSidebarNameplate',
  components: {
    CharacterEmblem,
  },
  props: {
    character: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.nameplate {
  position: relative;
  z-index: 4;

  display: grid;
  grid-template: 'emblem top' 1fr
                 'emblem bottom' 1fr
                 / 3rem 1fr;

  height: 3rem;

  color: $fg-white;
  white-space: nowrap;

  overflow: hidden;
  contain: paint;
}

.race,
.class {
  margin-right: 8px;
  opacity: 0.9;
}

.light {
  position: relative;

  padding-left: 12px;

  color: #ffe459;

  &:before {
    content: '\2726';

    position: absolute;
    font-size: 70%;
    transform: translateX(-111%) translateY(33%);
  }
}

.top,
.bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-right: 4px;
}

.top {
  flex-grow: 7;
  grid-area: top;
  padding-top: 4px;
}

.bottom {
  flex-grow: 3;
  grid-area: bottom;
  padding-bottom: 4px;
  font-size: 85%;
}

.background {
  z-index: -1;

  grid-row: 1 / -1;
  grid-column: 1 / -1;

  width: 100%;
  height: 100%;

  user-select: none;
  pointer-events: none;

  background-color: currentColor;
  overflow: hidden;
  contain: paint;

  object-fit: cover;
  object-position: left;
}
</style>
