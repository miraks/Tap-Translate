export default (fn, delay) =>
  new Promise((resolve) => {
    setTimeout(() => {
      resolve(fn())
    }, delay)
  })
