<script>
const SVGS = {};
const requireSVG = require.context('assets/svg', true, /[A-Za-z]+\.svg$/);
requireSVG.keys().forEach((fileName) => {
  let SVGConfig = requireSVG(fileName);
  SVGConfig = SVGConfig.default || SVGConfig;
  const SVGName = fileName.replace(/^.+\//, '').replace(/\.\w+$/, '');
  SVGS[SVGName] = SVGConfig;

  if (process.env.NODE_ENV !== 'production') {
    console.groupCollapsed(`Register svg: ${SVGName}`);
    console.log(SVGConfig);
    console.groupEnd(`Register svg: ${SVGName}`);
  }
});

export default {
  name: 'BaseIcon',
  functional: true,
  props: {
    glyph: {
      type: String,
      required: true,
      validator(name) { return Object.keys(SVGS).includes(name); },
    },
    size: {
      type: [Number, String],
      required: false,
      validator(value) { return !Number.isNaN(parseInt(value, 10)); },
    },
  },
  render(h, ctx) {
    const { props } = ctx;
    const { id, url, viewBox } = SVGS[props.glyph];

    const href = process.env.NODE_ENV !== 'production' ? `#${id}` : url;
    const children = [h(
      'use',
      { attrs: { 'xlink:href': href } },
    )];

    const size = typeof props.size === 'number' ?
      `${props.size}px` :
      props.size;

    const { attrs = {}, style = {} } = ctx.data;
    attrs.viewBox = viewBox;
    if (size) {
      style.width = size;
      style.height = size;
    }

    return h('svg', { ...ctx.data, attrs, style }, children);
  },
};
</script>
