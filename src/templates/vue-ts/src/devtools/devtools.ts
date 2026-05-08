chrome.devtools.panels.create(
  'My Extension',
  '',
  'src/devtools/index.html',
  () => {
    console.log('DevTools panel created')
  }
)
