import { render, h } from 'preact'
import '@/content/styles/index.sass'
import debounce from '@/helpers/debounce'
import Main from '@/content/components/Main'

const reinitDelay = 200
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
  const root = document.createElement('div')
  root.id = 'tap-translate'
  document.body.appendChild(root)
  render(<Main selectionListener={selectionListener} storageListener={storageListener}/>, root)

  const observer = new MutationObserver(() => {
    if (document.body.lastElementChild === root) return
    root.remove()
    observer.disconnect()
    setTimeout(init, reinitDelay)
  })
  observer.observe(document.body, { childList: true })
}

init()
