let saveButton = document.getElementById('save-button')
let urlInput = document.getElementById('server-url')
let lastUpdatedEl = document.getElementById('last-updated')

chrome.storage.sync.get('serverUrl', (data) => {
  urlInput.value = data.serverUrl || ''
})
// Set default lastUpdated to 90 days
const defaultLastUpdated = Date.now() - 90 * 86400 * 1000
chrome.storage.sync.set({ lastUpdated: defaultLastUpdated })
chrome.storage.sync.get('lastUpdated', (data) => {
  lastUpdatedEl.innerText = new Date(data.lastUpdated).toLocaleString()
})

saveButton.addEventListener('click', () => {
  chrome.storage.sync.set({ serverUrl: urlInput.value }, () => {
    console.log('Server URL: ' + urlInput.value)
  })
})
