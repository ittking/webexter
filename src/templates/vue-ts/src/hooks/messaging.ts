import type { Runtime } from 'webextension-polyfill'

type MessageSender = Runtime.MessageSender

export interface MessagePayload<T = unknown> {
  name: string
  args?: T
}

export interface ResponsePayload<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

type MessageHandler<T = unknown, R = unknown> = (args: T, sender: MessageSender) => R | Promise<R>

export async function sendMessage<T = unknown, R = unknown>(
  name: string,
  args?: T,
  options?: { timeout?: number }
): Promise<R> {
  const { timeout = 10000 } = options ?? {}

  const payload: MessagePayload<T> = { name, args }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message "${name}" timed out after ${timeout}ms`))
    }, timeout)

    browser.runtime.sendMessage(payload).then((response) => {
      clearTimeout(timer)
      if (response && typeof response === 'object') {
        const resp = response as ResponsePayload<R>
        if (resp.success && resp.data !== undefined) {
          resolve(resp.data)
        } else if (resp.error) {
          reject(new Error(resp.error))
        } else {
          resolve(response as R)
        }
      } else {
        resolve(response as R)
      }
    }).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

export async function sendMessageToTab<T = unknown, R = unknown>(
  tabId: number,
  name: string,
  args?: T,
  options?: { timeout?: number }
): Promise<R> {
  const { timeout = 10000 } = options ?? {}

  const payload: MessagePayload<T> = { name, args }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message "${name}" timed out after ${timeout}ms`))
    }, timeout)

    browser.tabs.sendMessage(tabId, payload).then((response) => {
      clearTimeout(timer)
      if (response && typeof response === 'object') {
        const resp = response as ResponsePayload<R>
        if (resp.success && resp.data !== undefined) {
          resolve(resp.data)
        } else if (resp.error) {
          reject(new Error(resp.error))
        } else {
          resolve(response as R)
        }
      } else {
        resolve(response as R)
      }
    }).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

const handlers = new Map<string, MessageHandler>()

export function registerMessageHandler<T = unknown, R = unknown>(
  name: string,
  handler: MessageHandler<T, R>
): () => void {
  handlers.set(name, handler as MessageHandler)

  const wrappedHandler = (message: unknown, sender: MessageSender) => {
    return (async () => {
      try {
        const payload = message as MessagePayload<T>
        const result = await Promise.resolve(handler(payload.args ?? {} as T, sender))
        return {
          success: true,
          data: result,
        } as ResponsePayload<R>
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        } as ResponsePayload
      }
    })()
  }

  browser.runtime.onMessage.addListener(wrappedHandler as Runtime.OnMessageListener)

  return () => {
    browser.runtime.onMessage.removeListener(wrappedHandler as Runtime.OnMessageListener)
    handlers.delete(name)
  }
}

export function createSender<T = unknown, R = unknown>(name: string) {
  return (args?: T, options?: { timeout?: number }) =>
    sendMessage<T, R>(name, args, options)
}

export function createTabSender<T = unknown, R = unknown>(tabId: number, name: string) {
  return (args?: T, options?: { timeout?: number }) =>
    sendMessageToTab<T, R>(tabId, name, args, options)
}

export function clearAllHandlers(): void {
  handlers.clear()
}