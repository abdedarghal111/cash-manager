import { mount } from 'svelte'
// @ts-ignore
import '@src/styles/global.css'
import App from '@src/App.svelte'

const app = mount(App, {
  target: document.body!,
})

export default app
