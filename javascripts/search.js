class Search {
  constructor({ serverUrl, authToken }) {
    this._serverUrl = serverUrl
    this._authToken = authToken
    this._results = []
  }

  get results() { return this._results }

  set results(res) { this._results = res }

  async run({ query, limit }) {
    const searchUrl = `${this._serverUrl}/search`
    const payload = { query, limit }
    const response = await fetch(searchUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    const page = await response.json()
    return page
  }

  appendResults() {
    // Results container
    const resultsContainer = document.querySelector('.mw #rcnt #rhs')
    if (!resultsContainer) return
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

chrome.storage.sync.get(['serverUrl', 'authToken'], async (data) => {
  const serverUrl = data.serverUrl || ''
  const authToken = data.authToken || ''
  const queryInput = document.querySelector('form[action="/search"] input[type="text"]')
  const query = queryInput.value.split(/[+ ]/).filter(e => !!e).join('&')
  const limit = 30
  const search = new Search({ serverUrl, authToken })
  const response = await search.run({ query, limit })
  const results = response[0]
  if (results.length === 0) return
  search.results = results
  search.appendResults()
})
