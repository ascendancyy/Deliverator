<script>
export default {
  name: 'CharacterEmblem',
  props: {
    size: {
      type: [Number, String],
      required: false,
      validator(value) { return !Number.isNaN(parseInt(value, 10)); },
    },
    src: {
      type: String,
      required: true,
    },
  },
  render(h) {
    const children = [];
    const style = {};
    const imgAttrs = { src: this.src, alt: '' };

    if (this.size) {
      if (typeof this.size === 'string') {
        style.width = this.size;
        style.height = this.size;
      } else {
        const size = `${this.size}px`;

        style.width = size;
        style.height = size;

        imgAttrs.width = size;
        imgAttrs.height = size;
      }
    }

    if (this.$slots.default) {
      children.push(h(
        'div',
        { class: { [this.$style.overlay]: true } },
        [this.$slots.default],
      ));
    }

    children.push(h('img', { class: [this.$style.image], attrs: imgAttrs }));
    return h('div', { style, class: [this.$style.emblem] }, children);
  },
};
</script>

<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.emblem {
  position: relative;

  display: flex;
  justify-content: center;
  flex-direction: column;
  flex-shrink: 0;

  height: 100%;

  user-select: none;
}

.image {
  position: relative;
  z-index: 0;

  display: block;
  max-width: 100%;
  max-height: 100%;

  background-color: #6e92db;
}

.overlay { z-index: 1; }
</style>
