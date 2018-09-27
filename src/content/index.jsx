import { render, h } from 'preact'
import '@/content/styles/index.sass'
import shadowStyles from '!to-string-loader!css-loader!sass-loader!@/content/styles/shadow.sass'
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

  let shadow = null
  if (root.attachShadow) {
    shadow = root.attachShadow({ mode: 'open' })
    const style = document.createElement('style')
    style.textContent = shadowStyles
    shadow.appendChild(style)
  }

  render(<Main selectionListener={selectionListener} storageListener={storageListener}/>, shadow || root)

  const observer = new MutationObserver(() => {
    if (document.body.lastElementChild === root) return
    root.remove()
    observer.disconnect()
    setTimeout(init, reinitDelay)
  })
  observer.observe(document.body, { childList: true })
}

init()
