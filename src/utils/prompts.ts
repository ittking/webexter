import prompts from 'prompts'

export const FRAMEWORKS = [
  { title: 'React', value: 'react' },
  { title: 'Vue', value: 'vue' },
] as const

export const LANGUAGES = [
  { title: 'TypeScript', value: 'ts' },
  { title: 'JavaScript', value: 'js' },
] as const

export const AVAILABLE_MODULES = [
  { title: 'Background (Service Worker)', value: 'background', description: 'Background service worker' },
  { title: 'Content Script', value: 'content', description: 'Content script injected into pages' },
  { title: 'Popup', value: 'popup', description: 'Browser action popup page' },
  { title: 'Options Page', value: 'options', description: 'Extension options page' },
  { title: 'Side Panel', value: 'sidepanel', description: 'Browser side panel' },
  { title: 'New Tab Page', value: 'newtab', description: 'Override browser new tab page' },
  { title: 'DevTools Page', value: 'devtools', description: 'DevTools extension panel' },
] as const

export async function promptFramework(): Promise<'vue' | 'react'> {
  const response = await prompts({
    type: 'select',
    name: 'framework',
    message: 'Select a framework:',
    choices: FRAMEWORKS.map(f => ({ title: f.title, value: f.value })),
  })

  if (!response.framework) {
    console.log('No framework selected. Defaulting to Vue.')
    return 'vue'
  }

  return response.framework
}

export async function promptLanguage(): Promise<'ts' | 'js'> {
  const response = await prompts({
    type: 'select',
    name: 'language',
    message: 'Select a language:',
    choices: LANGUAGES.map(l => ({ title: l.title, value: l.value })),
  })

  if (!response.language) {
    console.log('No language selected. Defaulting to TypeScript.')
    return 'ts'
  }

  return response.language
}

export async function promptModules(): Promise<string[]> {
  const response = await prompts({
    type: 'multiselect',
    name: 'modules',
    message: 'Select modules to include:',
    choices: AVAILABLE_MODULES.map(m => ({ title: m.title, value: m.value, description: m.description })),
    hint: '- Space to select, Enter to confirm',
  })

  if (!response.modules || response.modules.length === 0) {
    console.log('No modules selected. Defaulting to Popup + Background.')
    return ['popup', 'background']
  }

  return response.modules
}
