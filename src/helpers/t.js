const humanize = (str) =>
  str
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .toLowerCase()
    .replace(/^./, (c) => c.toUpperCase())

export default (key) => {
  const str = browser.i18n.getMessage(key)
  return str || humanize(key)
}
