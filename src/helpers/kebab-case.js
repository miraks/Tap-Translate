export default (str) =>
  str.replace(/[A-Z]/g, (match) => `-${match.toLowerCase()}`).replace(/^-/, '')
