export default (object, keys) =>
  Object.entries(object).reduce((result, [key, value]) => {
    if (keys.includes(key)) result[key] = value
    return result
  }, {})
