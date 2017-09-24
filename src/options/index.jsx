import { render, h } from 'preact'
import '@/options/styles/index.sass'
import Main from '@/options/components/Main'

const container = document.createElement('div')
document.body.appendChild(container)
render(<Main/>, container)
