<script>
import { cancelEvent, looseEqual } from 'src/utils';

export default {
  name: 'BaseOptionWrapper',
  props: {
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    focused: {
      type: Boolean,
      required: false,
      default: false,
    },
    label: {
      type: String,
      required: false,
    },
    tag: {
      type: String,
      required: false,
      default: 'li',
    },
    validator: {
      type: Function,
      required: false,
      validator(func) { return typeof func === 'function'; },
    },
    value: {
      type: null,
      required: true,
    },
  },
  watch: {
    value: function watchValue(value, oldValue) {
      if (!looseEqual(value, oldValue)) {
        this.$emit('update:attr', {
          vm: this,
          target: this.$el,
          value,
          oldValue,
          attributeName: 'value',
        });
      }
    },
    label: function watchLabel(value, oldValue) {
      this.$emit('update:attr', {
        vm: this,
        target: this.$el,
        value,
        oldValue,
        attributeName: 'label',
      });
    },
  },
  methods: {
    setPending(pending) {
      if (this.pending === pending) {
        return;
      }

      this.pending = pending;
    },
  },
  render(h) {
    const on = { '!click': event => this.disabled && cancelEvent(event) };
    const classes = [
      this.$style.option,
      {
        [this.$style.disabled]: this.disabled,
        [this.$style.focused]: this.focused,
      },
    ];
    const { default: label = [this.label] } = this.$slots;
    const attrs = {
      role: 'presentation',
      'aria-disabled': this.disabled,
    };
    return h(this.tag, { attrs, class: classes, on }, label);
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.option {
  position: relative;

  color: transparentize($fg-black, 0.25);
  user-select: none;
  cursor: default;

  overflow: hidden;

  &:nth-child(2n) { background-color: transparentize($bg-black, 0.96); }

  &:not(.disabled).focused {
    color: currentColor;
    cursor: pointer;
    background-color: transparentize($bg-focus, 0.75);
  }

  &:not(.disabled):active { background-color: transparentize($bg-focus, 0.5); }

  &.disabled {
    user-select: none;
    cursor: not-allowed;

    opacity: 0.5;
  }
}
</style>
