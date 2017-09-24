/* eslint-disable no-bitwise, no-plusplus, no-param-reassign, no-unused-expressions, no-sequences */

// https://github.com/bpierre/gtranslate/blob/master/providers/google-translate.js

export default (a) => {
  const tokenhelper = (a, b) => {
    for (let c = 0; c < b.length - 2; c += 3) {
      let d = b.charAt(c + 2)
      d = d >= 'a' ? d.charCodeAt(0) - 87 : Number(d)
      d = b.charAt(c + 1) === '+' ? a >>> d : a << d
      a = b.charAt(c) === '+' ? (a + d) & 4294967295 : a ^ d
    }
    return a
  }

  const b = 406394
  const d = []
  for (let e = 0, f = 0; f < a.length; f++) {
    let g = a.charCodeAt(f)
    g < 0x80
      ? (d[e++] = g)
      : (g < 0x800
        ? (d[e++] = (g >> 6) | 192)
        : ((g & 64512) === 55296 && f + 1 < a.length && (a.charCodeAt(f + 1) & 64512) === 56320
          ? ((g = 65536 + ((g & 1023) << 10) + (a.charCodeAt(++f) & 1023)),
            (d[e++] = (g >> 18) | 240),
            (d[e++] = ((g >> 12) & 0x3f) | 0x80))
          : (d[e++] = (g >> 12) | 0xe0),
          (d[e++] = ((g >> 6) & 0x3f) | 0x80)),
        (d[e++] = (g & 0x3f) | 0x80))
  }
  a = b
  for (let e = 0; e < d.length; e++) {
    (a += d[e]), (a = tokenhelper(a, '+-a^+6'))
  }
  a = tokenhelper(a, '+-3^+b+-f')
  a ^= 2641390264
  a < 0 && (a = (a & 2147483647) + 2147483648)
  a %= 1e6
  return `${a.toString()}.${a ^ b}`
}
