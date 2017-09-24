import { render, h } from 'preact'
import '@/content/styles/index.sass'
import debounce from '@/helpers/debounce'
import Main from '@/content/components/Main'

const reinitDelay = 500
const selectionChangeDelay = 200

const buildListener = (fn) => {
  let cb = () => {}
  fn((data) => {
    cb(data)
  })
  return (newCb) => {
    cb = newCb
  }
}

const selectionListener = buildListener((trigger) => {
  document.addEventListener(
    'selectionchange',
    debounce(() => {
      trigger(window.getSelection())
    }, selectionChangeDelay)
  )
})

const storageListener = buildListener((trigger) => {
  browser.storage.onChanged.addListener((changes) => {
    trigger(changes)
  })
})

const init = () => {
  const container = document.createElement('div')
  document.body.appendChild(container)
  render(<Main selectionListener={selectionListener} storageListener={storageListener}/>, container)

  const observer = new MutationObserver((mutations) => {
    const removed = mutations.some(({ removedNodes }) => Array.from(removedNodes).includes(container))
    if (!removed) return
    observer.disconnect()
    setTimeout(init, reinitDelay)
  })
  observer.observe(container.parentNode, { childList: true })
}

init()
