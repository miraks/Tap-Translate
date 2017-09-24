export default (fn, delay) => {
  let timerId = null
  return () => {
    clearTimeout(timerId)
    timerId = setTimeout(fn, delay)
  }
}
