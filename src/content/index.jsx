import { render, h } from 'preact'
import shadowStyles from '@/content/styles/shadow.sass?string'
import noShadowStyles from '@/content/styles/no-shadow.sass?string'
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
  const main = <Main selectionListener={selectionListener} storageListener={storageListener}/>
  const style = document.createElement('style')
  const root = document.createElement('div')
  root.id = 'tap-translate'
  document.body.appendChild(root)

  if (root.attachShadow) {
    const shadow = root.attachShadow({ mode: 'open' })
    style.textContent = shadowStyles
    shadow.appendChild(style)
    render(main, shadow)
  } else {
    style.textContent = noShadowStyles
    root.appendChild(style)
    render(main, root)
  }

  const observer = new MutationObserver(() => {
    if (document.body.lastElementChild === root) return
    root.remove()
    observer.disconnect()
    setTimeout(init, reinitDelay)
  })
  observer.observe(document.body, { childList: true })
}

init()
