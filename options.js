'use strict';

let saveButton = document.getElementById('save');
let urlInput = document.getElementById('server-url');

chrome.storage.sync.get('serverUrl', (data) => {
  urlInput.value = data.serverUrl || '';
});
saveButton.addEventListener('click', () => {
  chrome.storage.sync.set({ serverUrl: urlInput.value }, () => {
    console.log('Server URL: ' + urlInput.value);
  });
})
