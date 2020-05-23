const search = (serverUrl, query) => {
  const searchUrl = `${serverUrl}/search`;
  const payload = { query: query };
  let xhr = new XMLHttpRequest();
  xhr.open('POST', searchUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
  xhr.onreadystatechange = function() {
    if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
      console.log(JSON.parse(this.responseText));
    }
  }
  xhr.send(JSON.stringify(payload));
}

chrome.storage.sync.get('serverUrl', (data) => {
  const serverUrl = data.serverUrl || '';
  const queryInput = document.querySelector('form[action="/search"] input[type="text"]');
  const query = queryInput.value.split(/[+ ]/).filter(e => !!e).join('|');
  search(serverUrl, query);
});
