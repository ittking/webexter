export async function sendMessage(name, args, options) {
  const { timeout = 10000 } = options ?? {}

  const payload = { name, args }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message "${name}" timed out after ${timeout}ms`))
    }, timeout)

    browser.runtime.sendMessage(payload).then((response) => {
      clearTimeout(timer)
      if (response && typeof response === 'object') {
        if (response.success && response.data !== undefined) {
          resolve(response.data)
        } else if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      } else {
        resolve(response)
      }
    }).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

export async function sendMessageToTab(tabId, name, args, options) {
  const { timeout = 10000 } = options ?? {}

  const payload = { name, args }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Message "${name}" timed out after ${timeout}ms`))
    }, timeout)

    browser.tabs.sendMessage(tabId, payload).then((response) => {
      clearTimeout(timer)
      if (response && typeof response === 'object') {
        if (response.success && response.data !== undefined) {
          resolve(response.data)
        } else if (response.error) {
          reject(new Error(response.error))
        } else {
          resolve(response)
        }
      } else {
        resolve(response)
      }
    }).catch((error) => {
      clearTimeout(timer)
      reject(error)
    })
  })
}

const handlers = new Map()

export function registerMessageHandler(name, handler) {
  handlers.set(name, handler)

  const wrappedHandler = (message, sender) => {
    return (async () => {
      try {
        const result = await Promise.resolve(handler(message.args ?? {}, sender))
        return {
          success: true,
          data: result,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })()
  }

  browser.runtime.onMessage.addListener(wrappedHandler)

  return () => {
    browser.runtime.onMessage.removeListener(wrappedHandler)
    handlers.delete(name)
  }
}

export function createSender(name) {
  return (args, options) =>
    sendMessage(name, args, options)
}

export function createTabSender(tabId, name) {
  return (args, options) =>
    sendMessageToTab(tabId, name, args, options)
}

export function clearAllHandlers() {
  handlers.clear()
}