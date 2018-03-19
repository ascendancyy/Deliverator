<template>
  <div
    v-blur="hideDropdown"
    v-bind="attrs"
    :class="classes"
    :style="selectStyle"
    @keydown.self.esc.prevent.stop="hideDropdown"
    @keydown.self.up.stop="movePointerBackward"
    @keydown.self.down.stop="movePointerForward"
    @keydown.self.tab.stop.prevent="handleTab"
    @keydown.self.enter.stop.prevent="handleEnter">
    <button
      ref="preview"
      :class="$style.preview"
      tabindex="-1"
      type="button"
      @click.capture.prevent="toggleDropdown">
      <transition
        :enter-class="!multiple ? $style.textSlideEnter : ''"
        :enter-active-class="!multiple ? $style.textSlideEnterActive : ''"
        :leave-active-class="!multiple ? $style.textSlideLeaveActive : ''"
        :leave-to-class="!multiple ? $style.textSlideLeaveTo : ''">
        <div
          v-show="!pending || multiple"
          :class="$style.selected">
          <!-- Placeholder -->
          <div
            v-if="showPlaceholder"
            :class="$style.placeholder">
            {{ placeholder }}
          </div>

          <!-- Selected Item(s) -->
          <template v-else>
            <span
              v-if="!multiple"
              key="single"
              :class="$style.single">
              {{ selected.label }}
            </span>
            <p
              v-else
              v-show="selectedMultiple.length > 0"
              key="multi"
              :class="$style.multi">
              {{ multilabel }}
            </p>
          </template>
        </div>
      </transition>

      <!-- Chevron / Spinner -->
      <div :class="$style.indicator">
        <BaseIcon
          :size="8"
          :class="$style.chevron"
          glyph="arrow"
        />
        <BaseIcon
          v-if="!multiple"
          v-show="pending"
          :size="8"
          :class="$style.spinner"
          glyph="refresh"
        />
      </div>
    </button>

    <!-- Dropdown -->
    <transition
      :enter-class="$style.slideEnter"
      :enter-active-class="$style.slideEnterActive"
      :leave-active-class="$style.slideLeaveActive"
      :leave-to-class="$style.slideLeaveTo">
      <div
        v-show="visible"
        ref="dropdown"
        :class="$style.dropdown"
        :style="dropdownStyle">
        <ul
          ref="options"
          :class="$style.dropdownList"
          role="listbox"
          @mouseleave.self.stop="pointerIndex = -1">
          <BaseOptionWrapper
            v-for="(option, index) in options"
            :key="option.id"
            :value="option.value"
            :label="option.label"
            :validator="option.validator"
            :focused="index == pointerIndex"
            :disabled="option.disabled"
            :data-index="index"
            :data-id="option.id"
            :class="$style.option"
            @mouseenter.native.capture="setPointer(index)"
            @mousemove.native.capture="setPointer(index)">
            <slot
              :visible="visible"
              :index="index"
              :value="option.value"
              :label="option.label"
              :disabled="option.disabled"
              :focused="index == pointerIndex"
              :selected="Object.values(selectedIds).includes(option.id)"
              :pending="Object.values(pendingIds).includes(option.id)"
              name="item">
              <span
                :aria-selected="Object.values(selectedIds).includes(option.id)"
                :class="$style.label"
                role="option">
                {{ option.label }}
              </span>
            </slot>
          </BaseOptionWrapper>
        </ul>
      </div>
    </transition>
  </div>
</template>

<script>
import _ from 'lodash';

import {
  isTrue,
  isFalse,
  isPrimitive,
  looseEqual,
  raf,
  cancelRaf,
  random,
} from 'src/utils';

import globalScssColors from 'Snowcrash/variables/_color.scss';

const { global: colors } = globalScssColors;

function findTextNode(parentNode, type = 'first') {
  const walker = document.createTreeWalker(
    parentNode,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function acceptNode(node) {
        return isFalse(/^\s*$/.test(node.data)) ?
          NodeFilter.FILTER_ACCEPT :
          NodeFilter.FILTER_REJECT;
      },
    },
  );

  let text = '';
  switch (type) {
    case 'all': {
      const nodes = [];
      while (walker.nextNode()) {
        nodes.push(walker.currentNode.wholeText);
      }
      text = nodes.join(' ');
      break;
    }
    case 'first':
    default: {
      const node = walker.firstChild();
      if (node) {
        text = node.wholeText;
      }
    }
  }

  return text;
}

function getComponentName(opts) {
  return opts && (opts.Ctor.options.name || opts.tag).toLowerCase();
}

function getComponentMixin(opts) {
  return opts && (opts.Ctor.options.mixins || [])
    .map(mixin => mixin.name.toLowerCase());
}

function getLabel(elm) {
  return (
    elm.getAttribute('label') ||
    findTextNode(elm, 'first')
  );
}

function propertiesForOption(option, ...propertyNames) {
  if (!propertyNames.length) {
    propertyNames.push('value');
  }

  const properties = {};
  let elm;
  let opt;

  if (isTrue(Array.isArray(option))) {
    [opt, elm] = option;
  } else {
    opt = option;
    elm = option.$el;
  }

  propertyNames.forEach((prop) => {
    let value = opt.$props[prop];
    if (!value) {
      value = prop === 'label' ?
        getLabel(elm) :
        elm.getAttribute(prop);
    }

    if (value) {
      properties[prop] = value;
    } else {
      console.warn(`Could not retrieve property: ${prop} in ${elm}`);
    }
  });

  return properties;
}

function matchValue(option, value) {
  const { value: optionValue } = propertiesForOption(option);
  return optionValue && looseEqual(optionValue, value);
}

function removeFromCollection(collection, predicate) {
  const index = _.findIndex(collection, predicate);
  if (index !== -1) {
    const [removed] = collection.splice(index, 1);
    return removed;
  }

  return -1;
}

function componentIsOption(option) {
  const vnode = option.$vnode;
  if (vnode && vnode.componentOptions) {
    const { componentOptions } = vnode;
    return (
      getComponentName(componentOptions) === 'baseoptionwrapper' ||
      getComponentMixin(componentOptions).includes('baseoptionwrapper')
    );
  }

  return false;
}

function getKey(vnode, id) {
  const hasKey = vnode.key !== null;
  if (!hasKey) {
    return vnode.isComment ? `${id}comment` : id + vnode.tag;
  }

  if (isPrimitive(vnode.key)) {
    const keyHasId = String(vnode.key).indexOf(id) !== -1;
    return keyHasId ? vnode.key : id + vnode.key;
  }

  return vnode.key;
}

export default {
  name: 'BaseSelect',
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    multiple: {
      type: Boolean,
      required: false,
      default: false,
    },
    options: {
      type: Array,
      default: () => [],
    },
    placeholder: {
      type: String,
      required: false,
      default: '',
    },
    tabindex: {
      type: String,
      required: false,
      default: '0',
    },
    validateUser: {
      type: Boolean,
      required: false,
      default: true,
    },
    validateWatch: {
      type: Boolean,
      required: false,
      default: false,
    },
    value: {
      type: [Array, Number, String, Object],
      required: false,
    },
  },
  data() {
    return {
      visible: false,

      previousSelected: null,
      selectedIds: {},
      selectedNodes: new WeakSet([]),
      selectedMultiple: [],
      selected: {
        value: '',
        label: '',
      },

      cachedValues: [],

      observer: undefined,
      observedNodes: new WeakMap([]),

      pending: false,
      pendingIds: {},
      pendingNodes: new WeakSet([]),
      pendingCount: 0,

      pointerIndex: -1,

      dropdownStyle: {
        height: '',
      },

      selectAnimProps: {},
      selectStyle: {
        color: '',
        borderColor: '',
        transform: '',
      },
      selectShaking: false,
      selectAnimationFrame: -1,
    };
  },
  computed: {
    classes() {
      return [
        this.$style.select,
        {
          [this.$style.visible]: this.visible,
          [this.$style.disabled]: this.disabled,

          [this.$style.pending]: this.pending && !this.multiple,
        },
      ];
    },
    showPlaceholder() {
      const hasItems = this.selectedMultiple.length > 0;
      return (
        (!this.multiple && !this.selected.label) ||
        (this.multiple && !hasItems)
      );
    },
    multilabel() {
      return this.selectedMultiple.map(item => item.label).join(', ');
    },
    attrs() {
      const attrs = {};
      if (!this.disabled) {
        attrs.tabindex = this.tabindex;
      }
      return attrs;
    },
  },
  watch: {
    value: function valueUpdate(values, oldValues) {
      if (this.$children.length === 0) {
        return;
      }

      if (!this.multiple) {
        const value = values;
        const oldValue = oldValues;

        if (looseEqual(value, oldValue)) {
          return;
        }

        const matchedOption = this.$children
          .filter(componentIsOption)
          .find(opt => matchValue(opt, value));

        if (matchedOption && isFalse(this.selectedNodes.has(matchedOption.$el))) {
          this.selectOption(matchedOption, matchedOption.$el, this.validateWatch);
        }

        const selectedOption = this.$children.find(child => this.selectedNodes.has(child.$el));
        if (selectedOption) {
          const { value: selectedValue } = propertiesForOption(selectedOption);

          if (looseEqual(selectedValue, oldValue)) {
            if (!matchedOption) {
              this.selected.value = '';
              this.selected.label = '';
            }

            this.deselectOption(selectedOption, selectedOption.$el);
          }
        }
      } else {
        const matchedValues = _.differenceWith(values, this.cachedValues, looseEqual);
        const hasMatchedValues = matchedValues.length > 0;
        const removedValues = _.differenceWith(this.cachedValues, values, looseEqual);
        const hasRemovedValues = removedValues.length > 0;

        let notSelected = [];
        let selected = [];
        if (hasMatchedValues && hasRemovedValues) {
          [selected, notSelected] = _.partition(
            this.$children.filter(componentIsOption),
            opt => this.selectedNodes.has(opt.$el),
          );
        } else if (hasMatchedValues && !hasRemovedValues) {
          selected = this.$children
            .filter(componentIsOption)
            .filter(opt => this.selectedNodes.has(opt.$el));
        } else if (!hasMatchedValues && hasRemovedValues) {
          notSelected = this.$children
            .filter(componentIsOption)
            .filter(opt => !this.selectedNodes.has(opt.$el));
        }

        if (hasMatchedValues) {
          this.optionsForValues(notSelected, matchedValues)
            .forEach(opt => this.selectOption(opt, opt.$el, this.validateWatch));
        }

        if (hasRemovedValues) {
          this.optionsForValues(selected, removedValues)
            .forEach(opt => this.deselectOption(opt, opt.$el));
        }

        if (hasMatchedValues || hasRemovedValues) {
          this.cachedValues = [...values];
        }
      }
    },
  },
  created() {
    this.observer = new MutationObserver(ml => ml.forEach(this.handleMutation));
  },
  mounted() {
    const target = this.$refs.options;
    this.setupNodes(target.children);
    this.observer.observe(target, { childList: true });

    if (!this.value) {
      return;
    }

    const options = this.$children.filter(componentIsOption);
    const matchedOptions = this.optionsForValues(options, this.value);

    if (!this.multiple && matchedOptions) {
      this.selectOption(matchedOptions, matchedOptions.$el, this.validateWatch);
    } else if (this.multiple) {
      matchedOptions.forEach(opt => this.selectOption(opt, opt.$el, this.validateWatch));
    }
  },
  beforeDestroy() {
    this.observer.disconnect();
  },
  methods: {
    validatorFailed: function validatorFailed() {
      if (!this.visible && !this.selectShaking) {
        this.selectShaking = true;
        this.selectAnimProps = Object.seal({
          intensity: 1.5,
          progress: 0,
          last: performance.now(),
          frameCount: 0,
          lastDirection: -1,
          duration: 410,
        });
        raf(this.shake);
      }
    },

    shake: function shake(now) {
      if (!this.selectShaking || this.selectAnimProps.progress > this.selectAnimProps.duration) {
        this.selectShaking = false;
        this.selectStyle.color = '';
        this.selectStyle.borderColor = '';
        this.selectStyle.transform = '';
        cancelRaf(this.selectAnimationFrame);
        return;
      }

      const { value: { hex: errorColor } } = colors['$error-color'];
      this.selectStyle.color = errorColor;
      this.selectStyle.borderColor = errorColor;

      this.selectAnimProps.progress += now - this.selectAnimProps.last;
      this.selectAnimProps.last = now;

      if (this.selectAnimProps.frameCount % 2) {
        const { intensity } = this.selectAnimProps;
        const x = this.selectAnimProps.lastDirection * intensity;
        const y = random(-intensity, intensity);
        const ran = Math.max(
          0,
          Math.cbrt(this.selectAnimProps.duration -
                    (this.selectAnimProps.progress / 1e3)),
        );

        this.selectAnimProps.intensity *= Math.min(1, ran);
        this.selectAnimProps.lastDirection *= -1;
        this.selectStyle.transform = `translate3d(${x}px, ${y}px, 0)`;
      }

      this.selectAnimProps.frameCount += 1;
      this.selectAnimationFrame = raf(this.shake);
    },

    selectOption: async function selectOption(vm, elm, validate = true) {
      const { selectedNodes, pendingNodes, multiple } = this;

      const inSelectedNodes = selectedNodes.has(elm);
      const pendingSingle = !multiple && validate && this.pendingCount > 0;
      const pendingMultiple = multiple && pendingNodes.has(elm);
      if (inSelectedNodes || pendingSingle || pendingMultiple) {
        return;
      }

      selectedNodes.add(elm);

      // eslint-disable-next-line no-underscore-dangle
      const id = `-א-${vm._uid}-`;
      const key = getKey(vm.$vnode, id);

      if (multiple && _.some(this.selectedMultiple, { key })) {
        return;
      }

      const { value, label } = propertiesForOption([vm, elm], 'value', 'label');
      if (validate && typeof vm.validator === 'function') {
        this.pendingCount += 1;
        pendingNodes.add(elm);

        const oldValue = this.selected.value;
        if (!multiple) {
          this.selected.value = '';
          if (this.previousSelected) {
            this.deselectOption(this.previousSelected, this.previousSelected.$el);
          }
        }

        const selfPendingTimeout = setTimeout(() => { this.pending = true; }, 269);
        const vmPendingTimeout = setTimeout(() => {
          if (vm.pending) {
            return;
          }

          vm.setPending(true);
          this.$set(this.pendingIds, elm.dataset.id, elm.dataset.id);
        }, 269);

        let valid = await vm.validator(value);
        const { value: defPrevious } = propertiesForOption([vm, elm]);
        const match = looseEqual(defPrevious, value);

        if (!match) {
          valid = false;
        }

        this.pendingCount -= 1;
        pendingNodes.delete(elm);

        clearTimeout(vmPendingTimeout);
        if (isTrue(vm.pending)) {
          this.$delete(this.pendingIds, elm.dataset.id);
          vm.setPending(false);
        }

        clearTimeout(selfPendingTimeout);
        if (isTrue(this.pending) && this.pendingCount === 0) {
          this.pending = false;
        }

        if (isFalse(valid)) {
          this.$emit('fail', { visible: this.visible, elm });
          this.validatorFailed();

          if (!multiple && oldValue) {
            const oldVM = this.previousSelected;
            if (oldVM) {
              const { value: optionValue } = propertiesForOption(oldVM);
              if (looseEqual(optionValue, oldValue)) {
                this.selectOption(oldVM, oldVM.$el, false);
              }
            } else {
              const oldNode = this.$children
                .filter(child => !selectedNodes.has(child.$el))
                .find(opt => matchValue(opt, oldValue));

              if (oldNode) {
                this.selectOption(oldNode, oldNode.$el, false);
              }
            }
          }

          this.deselectOption(vm, elm);
          return;
        }

        this.$emit('success', { visible: this.visible, elm });
      }

      this.$set(this.selectedIds, elm.dataset.id, elm.dataset.id);

      if (!multiple) {
        if (vm !== this.previousSelected) {
          if (this.previousSelected) {
            this.deselectOption(this.previousSelected, this.previousSelected.$el);
          }
          this.previousSelected = vm;
        }

        this.selected.value = value;
        this.selected.label = label;
        if (isFalse(looseEqual(this.value, value))) {
          this.$emit('change', value);
        }
      } else {
        this.selectedMultiple.push({ key, value, label });
        this.$emit('change', this.selectedMultiple.map(item => item.value));
      }
    },
    deselectOption: function deselectOption(vm, elm) {
      if (!this.selectedNodes.has(elm)) {
        return;
      }

      this.selectedNodes.delete(elm);

      this.$delete(this.selectedIds, elm.dataset.id);

      if (this.multiple) {
        // eslint-disable-next-line no-underscore-dangle
        const id = `-א-${vm._uid}-`;
        const searchKey = getKey(vm.$vnode, id);

        const { key = -1 } = removeFromCollection(
          this.selectedMultiple,
          { key: searchKey },
        ) || {};

        if (key !== -1) {
          this.$emit('change', this.selectedMultiple.map(item => item.value));
        }
      }
    },

    setupNodes: function setupNodes(nodes = []) {
      const options = this.$children.filter(componentIsOption);

      [...nodes].forEach((node) => {
        if (!this.observedNodes.has(node)) {
          const vm = options.find(opt => (opt.$el && opt.$el === node) || opt === node);
          this.observedNodes.set(node, vm);
          vm.$on('update:attr', this.handleAttributeChange);
          node.addEventListener('click', this.handleOptionClick, true);
        }
      });
    },
    handleOptionClick: function handleOptionClick({ currentTarget }) {
      if (this.pendingCount > 0 && !this.multiple) {
        return;
      }

      const vm = this.observedNodes.get(currentTarget);
      const { value } = propertiesForOption([vm, currentTarget]);

      if (!this.multiple) {
        if (
          this.selectedNodes.has(currentTarget) ||
          looseEqual(value, this.selected.value)
        ) {
          this.hideDropdown();
          return;
        }
      } else if (
        this.multiple &&
        this.selectedNodes.has(currentTarget) &&
        !this.pendingNodes.has(currentTarget)
      ) {
        this.deselectOption(vm, currentTarget);
        this.$emit('change', this.selectedMultiple.map(item => item.value));
        return;
      }

      this.selectOption(vm, currentTarget, this.validateUser);
      if (!this.multiple) {
        this.hideDropdown();
      }
    },
    handleMutation: function handleMutation(mutation) {
      const {
        type,
        target,
        addedNodes,
        removedNodes,
      } = mutation;

      if (type === 'childList' && target === this.$refs.options) {
        if (addedNodes.length > 0) {
          this.setupNodes(addedNodes);
        }

        removedNodes.forEach((node) => {
          const vm = this.observedNodes.get(node);

          if (this.selectedNodes.has(node)) {
            if (!this.multiple) {
              this.previousSelected = null;
              this.selected.value = '';
              this.selected.label = '';
              this.$emit('change');
            }
            this.deselectOption(vm, node);
          }

          if (!vm.$vnode.data.keepAlive) {
            node.removeEventListener('click', this.handleOptionClick, true);
            this.observedNodes.delete(node);
          }
        });
      }
    },
    handleAttributeChange: function handleAttributeChange(change) {
      const {
        vm,
        target,
        attributeName,
        value,
      } = change;

      if (!this.multiple) {
        if (
          !this.selectedNodes.has(target) &&
          looseEqual(value, this.value) &&
          !this.selected.value
        ) {
          if (!this.pendingNodes.has(target)) {
            this.selectOption(vm, target, this.validateWatch);
          }
          return;
        }

        if (this.selectedNodes.has(target) && !looseEqual(value, this.selected.value)) {
          const viableOption = this.$children
            .filter(componentIsOption)
            .find(opt => matchValue(opt, this.selected.value));

          if (!viableOption) {
            this.previousSelected = null;
            this.selected.value = '';
            this.selected.label = '';
          } else {
            this.selectOption(viableOption, viableOption.$el, this.validateWatch);
          }

          if (!this.pendingNodes.has(target)) {
            this.deselectOption(vm, target);
          }
        }
      } else {
        const { label } = propertiesForOption(vm, 'label');
        if (this.selectedNodes.has(target)) {
          // eslint-disable-next-line no-underscore-dangle
          const id = `-א-${vm._uid}-`;
          const key = getKey(vm.$vnode, id);
          const index = _.findIndex(this.selectedMultiple, { key, value });
          const hasIndex = index !== -1;

          if (hasIndex && attributeName === 'label') {
            this.selectedMultiple[index].label = label;
          } else if (
            !hasIndex &&
            attributeName === 'value' &&
            !this.pendingNodes.has(target)
          ) {
            this.deselectOption(vm, target);
          }
        } else if (this.value) {
          const diff = _.differenceWith(
            this.value,
            this.selectedMultiple.map(item => item.value),
            looseEqual,
          );
          if (!diff.length) {
            return;
          }

          const options = this.$children.filter(componentIsOption);
          const [found] = this.optionsForValues(options, diff);

          if (found) {
            this.selectOption(found, found.$el, this.validateWatch);
          }
        }
      }
    },

    movePointerForward() {
      if (!this.visible) {
        this.toggleDropdown();
      }

      for (let idx = 0; idx < this.options.length; idx += 1) {
        this.pointerIndex += 1;
        this.pointerIndex %= this.options.length;
        if (!this.options[this.pointerIndex].disabled) { break; }
      }

      [...this.$refs.options.children]
        .find(opt => Number(opt.dataset.index) === this.pointerIndex)
        .scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'nearest',
        });
    },
    movePointerBackward() {
      if (!this.visible) {
        this.toggleDropdown();
      }

      for (let idx = 0; idx < this.options.length; idx += 1) {
        this.pointerIndex -= 1;
        if (this.pointerIndex < 0) {
          this.pointerIndex = this.options.length - 1;
        }
        if (!this.options[this.pointerIndex].disabled) { break; }
      }

      [...this.$refs.options.children]
        .find(opt => Number(opt.dataset.index) === this.pointerIndex)
        .scrollIntoView({
          behavior: 'auto',
          block: 'start',
          inline: 'nearest',
        });
    },
    setPointer(index) {
      if (this.pointerIndex === index) {
        return;
      }

      this.pointerIndex = index;
    },
    handleTab(event) {
      if (this.visible) {
        this.hideDropdown();
      } else {
        // FIX: An element with a tabindex greater than 0 breaks the order.
        const focusable = [...document.querySelectorAll('[tabindex]')];
        const tabbable = focusable.filter(el => el.getAttribute('tabindex') !== '-1');
        const index = tabbable.indexOf(this.$el);
        const next = !event.shiftKey ?
          tabbable[(index + 1) % tabbable.length] :
          tabbable[index - 1 < 0 ? tabbable.length - 1 : index - 1];

        if (next) {
          next.focus();
        } else {
          this.$el.blur();
        }
      }
    },
    handleEnter() {
      if (this.pointerIndex !== -1 && this.options[this.pointerIndex].disabled) {
        return;
      }

      if (this.visible && this.pointerIndex !== -1) {
        const focusedOpt = [...this.$refs.options.children]
          .find(opt => Number(opt.dataset.index) === this.pointerIndex);
        this.selectOption(this.observedNodes.get(focusedOpt), focusedOpt, this.validateUser);
      }

      this.toggleDropdown();
    },

    toggleDropdown: function toggleDropdown() {
      if (this.disabled || (this.pending && !this.multiple)) {
        return;
      }

      this.visible = !this.visible;
      this.$emit('update:visible', this.visible);
      if (isTrue(this.visible)) {
        this.$el.focus();
      } else {
        this.pointerIndex = -1;
      }
    },
    hideDropdown: function hideDropdown() {
      if (!this.visible) {
        return;
      }
      this.visible = false;
      this.pointerIndex = -1;
      this.$emit('update:visible', false);
    },

    optionsForValues: function optionsForValues(children, values) {
      if (!this.multiple) {
        return children.find(child => matchValue(child, values));
      }

      if (process.env.NODE_ENV !== 'production' && !Array.isArray(values)) {
        console.error(`Expected array-like value, but got ${values}`);
        return undefined;
      }

      return Array.from(values, value => children.find(child => matchValue(child, value)))
        .filter(Boolean);
    },
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

$preview-duration: 225ms;

@keyframes spin {
  0% { transform: rotateZ(0); }
  100% { transform: rotateZ(1turn); }
}

.select {
  position: relative;

  display: inline-block;
  min-width: 60px;
  width: 100%;

  outline: none;
  border: 1px solid $bg-white-accent;
  border-radius: $border-radius;

  transition-property: border-color;
  transition-duration: $preview-duration;
  transition-timing-function: $standard-curve;

  &:not(.disabled):not(.pending):focus,
  &:not(.disabled):not(.pending):hover,
  &:not(.disabled):not(.pending).visible {
    border-bottom-color: $bg-focus-accent;
  }
}

.selected {
  display: flex;
  align-items: center;

  height: 100%;
  padding: 2px 0;

  white-space: nowrap;
  overflow: hidden;
}

.placeholder {
  color: currentColor;
  user-select: none;
  opacity: 0.4;
}

.single,
.multi {
  user-select: none;
}

.single {
  color: currentColor;
  text-overflow: ellipsis;
  overflow: hidden;
}

.multi {
  margin: 0;
  padding: 8px 0;
  font-size: 80%;
  line-height: 1.3;
}

.label {
  display: flex;
  padding: 4px;
}

.preview {
  position: relative;

  display: block;

  width: 100%;
  min-height: 28px;
  height: 100%;
  padding: 0 32px 0 8px;

  color: currentColor;
  text-align: left;

  cursor: pointer;
  appearance: none;

  outline: none;
  border: 0;
  border-radius: ($border-radius - 1);
  background-color: transparentize($bg-white, 0.33);

  overflow: hidden;
  contain: paint;

  transition-property: opacity, box-shadow, background-color;
  transition-duration: $preview-duration;
  transition-timing-function: $standard-curve;

  .disabled &,
  .pending & {
    user-select: none;
    cursor: not-allowed;

    opacity: 0.5;
    background-color: transparentize(#c4c4c4, 0.5);
  }

  .visible &,
  .select:not(.disabled):not(.pending) &:hover {
    background-color: $bg-white;
    box-shadow: 0 1px 6px $shadow-color;
  }
}

.indicator {
  position: absolute;
  top: calc(50% - 4px);
  right: 12px;

  width: 8px;
  height: 8px;

  transition: right $preview-duration $standard-curve;

  .pending & { right: calc(50% - 4px); }
}

.chevron,
.spinner {
  fill: currentColor;
}

.chevron {
  position: absolute;
  top: 0;
  left: 0;

  transform: rotateZ(90deg);

  transition: transform $preview-duration $standard-curve,
              opacity $preview-duration 10ms $standard-curve;

  .visible & { transform: rotateZ(-90deg); }

  .disabled & { opacity: 0.6; }

  .pending & {
    opacity: 0;
    transform: rotateZ(270deg);
  }
}

.spinner {
  position: absolute;
  top: 0;
  left: 0;

  opacity: 0;
  visibility: hidden;
  transition: opacity $preview-duration $standard-curve;

  animation: spin 800ms linear;
  animation-iteration-count: infinite;
  animation-fill-mode: both;
  animation-play-state: paused;

  .pending & {
    opacity: 1;
    visibility: visible;
    transition-delay: $preview-duration / 2;
    animation-play-state: running;
  }
}

.dropdown {
  position: absolute;
  z-index: 101;

  display: flex;

  margin-top: 4px;
  width: 100%;
  max-height: 20vh;

  border: 1px solid transparent;
  border-radius: $border-radius;
  background-color: $bg-white;
  box-shadow: 0 4px 4px $shadow-color;

  overflow: hidden;
  contain: paint;

  .visible & {
    border: 1px solid $bg-white-accent;
  }
}

.dropdownList {
  width: 100%;
  padding: 4px 0;
  overflow-y: auto;
}

.slideEnterActive,
.slideLeaveActive {
  transform-origin: 0 0;
}

.slideEnterActive {
  transition: opacity 225ms $standard-curve,
              transform 225ms $standard-curve;
}

.slideLeaveActive {
  transition: opacity 225ms $standard-curve,
              transform 225ms $standard-curve;
}

.slideEnter,
.slideLeaveTo {
  opacity: 0;
  transform: scaleY(0);
}

.textSlideEnterActive,
.textSlideLeaveActive {
  transition: transform $preview-duration $standard-curve;
}

.textSlideEnter,
.textSlideLeaveTo {
  transform: translateX(-100%);
}
</style>
