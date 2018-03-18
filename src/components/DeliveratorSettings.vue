<template>
  <transition
    :enter-class="$style.settingsEnter"
    :enter-active-class="$style.settingsEnterActive"
    :leave-active-class="$style.settingsLeaveActive"
    :leave-to-class="$style.settingsLeaveTo">
    <div
      v-if="visible"
      v-blur="hide"
      :class="$style.settings">
      <header
        v-once
        :class="$style.header">
        <h2 :class="$style.headerTitle">Settings</h2>
        <BaseIcon
          glyph="cancel"
          :size="24"
          :class="$style.close"
          @click="hide"
        />
      </header>

      <div :class="$style.section">
        <h3 :class="$style.sectionTitle">General</h3>
        <div :class="$style.setting">
          <BaseLabel
            tag="span"
            @click.native="$refs.languageSelect.$el.focus()">
            Language:
          </BaseLabel>
          <BaseSelect
            ref="languageSelect"
            v-model="language"
            :options="languageOptions"
            placeholder="Language">
            <BaseOption
              slot="item"
              slot-scope="option"
              :option="option">
              <span>{{ option.label }}</span>
            </BaseOption>
          </BaseSelect>
        </div>
      </div>

      <div :class="$style.section">
        <div :class="$style.setting">
          <h3 :class="$style.sectionTitle">Items</h3>
          <BaseLabel for="settings-item-size">
            Size: {{ itemSize }}px
          </BaseLabel>
          <BaseRange
            v-model.number="itemSize"
            id="settings-item-size"
            :min="32"
            :max="64"
            :class="$style.input"
          />
        </div>

        <div :class="$style.setting">
          <BaseLabel for="settings-item-spacing">
            Spacing: {{ itemSpacing }}px
          </BaseLabel>
          <BaseRange
            v-model.number="itemSpacing"
            id="settings-item-spacing"
            :min="1"
            :max="6"
            :class="$style.input"
          />
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'DeliveratorSettings',
  props: {
    visible: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  data() {
    return {
      languageOptions: [
        { id: 'en', value: 'en', label: 'English' },
        { id: 'de', value: 'de', label: 'Deutsch' },
        { id: 'es', value: 'es', label: 'Español' },
        { id: 'fr', value: 'fr', label: 'Français' },
        { id: 'it', value: 'it', label: 'Italiano' },
        { id: 'ja', value: 'ja', label: '日本語' },
        { id: 'pt-br', value: 'pt-br', label: 'Português (Brasil)' },
      ],
    };
  },
  computed: {
    language: {
      get() { return this.$store.state.settings.language; },
      set(language) {
        this.$store.commit('settings/SET_LANGUAGE', language);
        this.$store.dispatch(
          'activeMembership/FETCH_PROFILE',
          this.$store.state.activeMembership.platformType,
        );
      },
    },
    itemSize: {
      get() { return this.$store.state.settings.item.size; },
      set(size) { this.$store.commit('settings/SET_ITEM_SIZE', size); },
    },
    itemSpacing: {
      get() { return this.$store.state.settings.item.spacing; },
      set(spacing) { this.$store.commit('settings/SET_ITEM_SPACING', spacing); },
    },
  },
  methods: {
    hide() { this.$emit('update:visible', false); },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.settings {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 0;

  display: grid;
  grid-template: 'header' min-content;
  grid-auto-rows: min-content;

  width: 320px;
  height: 100%;

  border-left: 1px solid $bg-primary-accent;
  background-color: $bg-primary;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  grid-area: header;

  padding: 16px;

  color: $fg-white;
  font-weight: bold;
  font-size: $font-scale-3;

  border-left: 1px solid $bg-focus-accent;
  background-color: $bg-focus;
}

.headerTitle {
  margin: 0;
  font-size: $font-scale-4;
}

.close {
  margin-left: 8px;
  padding: 6px;

  cursor: pointer;

  opacity: 0.5;
  fill: $bg-white;

  transition: opacity 225ms $standard-curve;

  &:hover { opacity: 0.75; }
}

.section {
  margin: 16px;

  & + & {
    margin-top: 4px;
    padding-top: 8px;
    border-top: 1px solid $bg-white-accent;
  }
}

.sectionTitle {
  margin-top: 0;
  margin-bottom: 4px;

  font-weight: normal;
  font-size: $font-scale-2;
}

.label {
  display: inline-block;
  margin-bottom: 4px;

  color: transparentize($fg-black, 0.25);
  font-size: $font-scale-0;

  cursor: default;
}

.input,
.setting {
  width: 100%;
}

.setting {
  display: flex;
  align-items: flex-start;
  flex-direction: column;

  & + & { margin-top: 4px; }
}

.settingsEnterActive,
.settings-leaveActive {
  transition-property: opacity, transform;
  transition-duration: 300ms;
  transition-timing-function: $standard-curve;
}

.settingsEnter,
.settingsLeaveTo {
  opacity: 0.5;
  transform: scale(0.98);
}
</style>
