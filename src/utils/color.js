export function rgbToHex({ red, green, blue }) {
  // eslint-disable-next-line no-bitwise
  const bin = (red << 16) | (green << 8) | blue;
  const hex = bin.toString(16).toUpperCase();
  const fill = Array.from({ length: 6 - hex.length })
    .fill('0')
    .join('');

  return fill + hex;
}
