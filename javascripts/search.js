class Search {
  constructor({ serverUrl }) {
    this._serverUrl = serverUrl
    this._results = []
  }

  get results() { return this._results }

  set results(res) { this._results = res }

  run({ query, limit }) {
    return new Promise((resolve, reject) => {
      const searchUrl = `${this._serverUrl}/search`
      const payload = { query, limit }
      let xhr = new XMLHttpRequest()
      xhr.open('POST', searchUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          return resolve(JSON.parse(this.responseText))
        }
      }
      xhr.send(JSON.stringify(payload))
    })
  }

  appendResults() {
    // Results container
    const resultsContainer = document.querySelector('.mw #rcnt #rhs')
    const container = document.createElement('div')
    container.setAttribute('id', 'search-results-container')
    resultsContainer.prepend(container)
    // Each result
    this._results.forEach(result => {
      // Result: url
      const urlEl = document.createElement('div')
      urlEl.textContent = new URL(result.url).host
      urlEl.setAttribute('class', 'search-result-url')
      container.append(urlEl)
      // Result: title
      const titleEl = document.createElement('a')
      titleEl.textContent = result.title
      titleEl.setAttribute('class', 'search-result-title')
      titleEl.setAttribute('target', '_blank')
      titleEl.setAttribute('href', result.url)
      container.append(titleEl)
    })
  }
}

chrome.storage.sync.get('serverUrl', (data) => {
  const serverUrl = data.serverUrl || ''
  const queryInput = document.querySelector('form[action="/search"] input[type="text"]')
  const query = queryInput.value.split(/[+ ]/).filter(e => !!e).join('|')
  const limit = 30
  const search = new Search({ serverUrl })
  search.run({ query, limit })
    .then((response) => {
      const results = response[0]
      if (results.length === 0) return
      search.results = results
      search.appendResults()
    })
})
