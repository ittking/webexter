/// <reference types="vite/client" />

import type { Browser } from 'webextension-polyfill'

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare global {
  var browser: Browser
}
