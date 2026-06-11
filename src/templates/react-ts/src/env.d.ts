/// <reference types="vite/client" />

import type { Browser } from 'webextension-polyfill'

declare global {
  var browser: Browser
}