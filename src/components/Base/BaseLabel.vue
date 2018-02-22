<script>
export default {
  name: 'BaseLabel',
  props: {
    tag: {
      type: String,
      required: false,
      default: 'label',
    },
    for: {
      type: String,
      required: false,
    },
  },
  render(h) {
    return h(
      this.tag,
      {
        class: [this.$style.label],
        attrs: { for: this.for },
      },
      this.$slots.default,
    );
  },
};
</script>


<style module lang="scss">
@import '~Snowcrash/_variables.scss';

.label {
  display: inline-block;
  margin-bottom: 4px;
  font-size: 85%;
  cursor: default;
  opacity: 0.75;
}
</style>
