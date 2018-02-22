<script>
export default {
  name: 'BaseButton',
  functional: true,
  props: {
    href: {
      type: String,
      required: false,
    },
    toggled: {
      type: String,
      required: false,
    },
    disabled: {
      type: Boolean,
      required: false,
      default: false,
    },
    type: {
      type: String,
      required: false,
      default: 'default',
      validator(type) { return ['default', 'primary'].includes(type); },
    },
  },
  render(h, ctx) {
    const { props, $style } = ctx;

    const toggled = JSON.parse(props.toggled || 'false');

    const children = [];
    const { default: slot, icon } = ctx.slots();
    if (slot && slot.length > 0) { children.push(slot[0]); }
    if (icon && icon.length > 0) {
      children.unshift(h(
        'div',
        { class: [$style.icon] },
        [icon[0]],
      ));
    }

    const { attrs = {} } = ctx.data;
    if (props.href) {
      attrs.href = props.href;
    } else {
      attrs.type = 'button';
    }

    if (props.toggled) {
      attrs['aria-pressed'] = props.toggled;
    }

    if (props.disabled) {
      attrs.tabindex = -1;
    }

    let { class: classes = [] } = ctx.data;
    if (typeof classes === 'string') {
      classes = [classes];
    } else if (!Array.isArray(classes)) {
      classes[$style.button] = true;
      classes[$style.disabled] = props.disabled;
      classes[$style.toggled] = toggled;

      if (props.href) { classes[$style.link] = true; }
      if (props.type !== 'default') { classes[$style[props.type]] = true; }
    }

    if (Array.isArray(classes)) {
      classes.unshift($style.button);
      if (props.disabled) { classes.unshift($style.disabled); }
      if (toggled) { classes.unshift($style.toggled); }
      if (props.href) { classes.unshift($style.link); }
      if (props.type !== 'default') { classes.unshift($style[props.type]); }
    }

    const data = { ...ctx.data, attrs, class: classes };
    return h(!props.href ? 'button' : 'a', data, children);
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.button {
  display: flex;
  align-items: center;

  padding-right: 8px;
  padding-left: 8px;

  color: $fg-black;

  cursor: pointer;
  appearance: none;
  outline: none;

  border: 1px solid $bg-white-accent;
  border-radius: $border-radius;
  background-color: $bg-white;

  transition: all 225ms $standard-curve;

  &.link:not(.primary) { color: $fg-primary; }

  &:hover,
  &:focus {
    border-color: $bg-focus-accent;
    background-color: lighten($bg-white, 2%);
  }

  &:hover { box-shadow: 0 1px 5px transparentize($bg-focus, 0.75); }

  &:not(.primary):active {
    border-color: darken($bg-primary-accent, 2%);
    background-color: darken($bg-white, 2%);
    box-shadow: 0 0 3px transparentize($bg-focus, 0.75);
  }

  &:not(.primary).toggled {
    background-color: $bg-pale-white;
    box-shadow: inset 0 0 5px transparentize($bg-focus, 0.75);
  }
}

.primary {
  color: $fg-white;

  backface-visibility: hidden;
  border-color: $bg-focus-accent;
  background-color: $bg-focus;

  &:hover,
  &:focus {
    border-color: lighten($bg-focus-accent, 4%);
    background-color: lighten($bg-focus, 4%);
    box-shadow: 0 1px 5px transparentize($bg-black, 0.75);

    transform: translateY(-2px);
    transition-duration: 300ms;
  }

  &:active {
    border-color: darken($bg-focus-accent, 4%);
    background-color: darken($bg-focus, 4%);
    box-shadow: 0 0 4px transparentize($bg-black, 0.75);

    transform: translateY(0);
  }
}

.disabled {
  user-select: none;
  pointer-events: none;

  opacity: 0.5;
  background-color: transparentize(#c4c4c4, 0.5);
}

.icon {
  display: flex;
  margin-right: 4px;
  fill: currentColor;
}
</style>
