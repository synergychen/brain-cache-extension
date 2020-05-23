const search = ({ serverUrl, query, limit }) => {
  return new Promise((resolve, reject) => {
    const searchUrl = `${serverUrl}/search`;
    const payload = { query, limit };
    let xhr = new XMLHttpRequest();
    xhr.open('POST', searchUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        return resolve(JSON.parse(this.responseText));
      }
    }
    xhr.send(JSON.stringify(payload));
  });
}

chrome.storage.sync.get('serverUrl', (data) => {
  const resultsContainer = document.querySelector('.mw #rcnt #rhs');
  const serverUrl = data.serverUrl || '';
  const queryInput = document.querySelector('form[action="/search"] input[type="text"]');
  const query = queryInput.value.split(/[+ ]/).filter(e => !!e).join('|');
  const limit = 30;
  search({ serverUrl, query, limit })
    .then((response) => {
      const results = response[0];
      if (results.length === 0) return

      // Results container
      const container = document.createElement('div');
      container.setAttribute('id', 'search-results-container');
      resultsContainer.prepend(container);
      // Each result
      results.forEach(result => {
        // Result: url
        const urlEl = document.createElement('div');
        urlEl.textContent = new URL(result.url).host;
        urlEl.setAttribute('class', 'search-result-url');
        container.append(urlEl);
        // Result: title
        const titleEl = document.createElement('a');
        titleEl.textContent = result.title;
        titleEl.setAttribute('class', 'search-result-title');
        titleEl.setAttribute('href', result.url);
        container.append(titleEl);
      });
    });
});
