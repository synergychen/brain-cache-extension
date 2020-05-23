'use strict';

let savePage = document.getElementById('savePage');
let search = document.getElementById('search');
let serverUrl;

chrome.storage.sync.get('serverUrl', (data) => {
  serverUrl = data.serverUrl || '';
});

savePage.onclick = function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {
      code: `
        (() => {
          const title = 'Full text search';
          const createPageUrl = '${serverUrl}/pages'
          const content = document.querySelector('body').innerText;
          const visitedAt = new Date().toString();
          const url = document.location.href;
          const payload = {
            title: title,
            url: url,
            content: content,
            visited_at: visitedAt
          };
          let xhr = new XMLHttpRequest();
          xhr.open('POST', createPageUrl, true);
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
              console.log(JSON.parse(this.responseText));
            }
          }
          xhr.send(JSON.stringify(payload));
        })();
        `,
    })
  });
};

search.onclick = function() {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.executeScript(tabs[0].id, {
      code: `
        (() => {
          const searchUrl = '${serverUrl}/search';
          const payload = { query: 'skip' };
          let xhr = new XMLHttpRequest();
          xhr.open('POST', searchUrl, true);
          xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          xhr.onreadystatechange = function() {
            if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
              console.log(JSON.parse(this.responseText));
            }
          }
          xhr.send(JSON.stringify(payload));
        })();
        `,
    })
  });
};
