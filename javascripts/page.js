class Page {
  constructor({ serverUrl, authToken }) {
    this._serverUrl = serverUrl
    this._authToken = authToken
    this._data = null
    this._highlights = []
    this._highlighter = new Highlighter({ serverUrl, authToken, page: this })
  }

  get id() { return this._data && this._data.id }

  get data() { return this._data }

  set data(dat) { this._data = dat }

  get highlights() {
    if (!this._data) return []
    return this._data.metadata.highlights
  }

  get highlighter() { return this._highlighter }

  update(page) {
    this.data = page
    if (page) Storage.update(page)
  }

  render() {
    // Render star
    this.renderStar()
    // Render highlights
    if (this.highlights.length > 0) {
      this.highlighter.render(this.highlights)
    }
  }

  async findBy({ url }) {
    const searchUrl = `${this._serverUrl}/pages/search`
    const payload = { url }
    const response = await fetch(searchUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    const page = await response.json()
    this.update(page)
    return page
  }

  async star() {
    const starUrl = `${this._serverUrl}/pages/star`
    const title = document.querySelector('title').innerText
    const url = document.location.href
    const content = document.querySelector('body').innerText
    const visitedAt = new Date().toString()
    const payload = {
      title,
      url,
      content,
      visited_at: visitedAt
    }
    const response = await fetch(starUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    const page = await response.json()
    this.update(page)
    return page
  }

  async unstar() {
    const unstarUrl = `${this._serverUrl}/pages/${this.id}/unstar`
    const response = await fetch(unstarUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    await response.json()
    Storage.remove({ id: this.id })
    this.data = null
    return null
  }

  renderStar() {
    // Remove existing star button
    const existingStar = document.getElementById('brain-cache-star-wrapper')
    if (existingStar) existingStar.remove()
    // Add star/unstar button
    const isSolid = !!this._data
    const hollowClass = 'brain-cache-star-hollow'
    const solidClass = 'brain-cache-star-solid'
    const starEl = document.createElement('span')
    starEl.setAttribute('class', isSolid ? solidClass : hollowClass)
    starEl.addEventListener('click', () => {
      const hasSolidClass = starEl.getAttribute('class') === solidClass
      if (hasSolidClass) {
        // Already saved
        starEl.removeAttribute('class')
        starEl.setAttribute('class', hollowClass)
        this.unstar().then(_ => this.highlighter.reset())
      } else {
        // Not saved yet
        starEl.removeAttribute('class')
        starEl.setAttribute('class', solidClass)
        this.star()
      }
    })
    const el = document.createElement('div')
    el.setAttribute('id', 'brain-cache-star-wrapper')
    el.append(starEl)
    document.querySelector('body').append(el)
  }
}

class Highlighter {
  constructor({ serverUrl, authToken, page }) {
    this._serverUrl = serverUrl
    this._authToken = authToken
    this._page = page
  }

  get textSelected() { return document.getSelection().toString() }

  get isInput() {
    const selectedNode = document.getSelection().anchorNode
    const selfIsInput = selectedNode instanceof HTMLInputElement
    const wrapperIsInput = selectedNode.childElementCount > 0 &&
      Array.from(selectedNode.children).find(node => node instanceof HTMLInputElement)
    return selfIsInput || wrapperIsInput
  }

  get selectionHighlighted() {
    const selection = document.getSelection().getRangeAt(0)
    const parentEl = selection.startContainer.parentElement
    return parentEl.classList.contains('brain-cache-highlighted') && parentEl.innerText.includes(selection.toString())
  }

  get page() { return this._page }

  async add(text) {
    const highlightUrl = `${this._serverUrl}/pages/${this.page.id}/highlight`
    const payload = { text }
    const response = await fetch(highlightUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    const page = await response.json()
    this.page.update(page)
    this.render(this.page.highlights)
    return page
  }

  async remove(text) {
    const unhighlightUrl = `${this._serverUrl}/pages/${this.page.id}/unhighlight`
    const payload = { text }
    const response = await fetch(unhighlightUrl, {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: {
        'Authorization': 'Basic ' + this._authToken
      }
    })
    const page = await response.json()
    this.page.update(page)
    this.render(this.page.highlights)
    return page
  }

  async update() {
    const text = this.textSelected
    let page
    if (this.selectionHighlighted) {
      // Remove highlight
      page = await this.remove(text)
    } else {
      // Star page if not starred
      if (!Storage.get(this.page.id)) {
        await this.page.star()
        await this.page.renderStar()
      }
      // Add highlight
      page = await this.add(text)
    }
    this.page.update(page)
  }

  reset() {
    document.querySelectorAll('.brain-cache-highlighted').forEach((el) => {
      if (el.parentElement) {
        el.parentElement.innerText = el.parentElement.innerText
      }
    })
  }

  render(texts) {
    const htmlEntities = (str) => {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
    }
    // Find str1 in str2
    function found(str1, str2) {
      const chars = str1.split('')
      const regStr = chars
        .map((char) => `(<[^>]*>)*${char}[\\s]*(<[^>]*>)*[\\s]*`)
        .join('')
      const regex = new RegExp(regStr)
      const matches = regex.exec(str2)
      return {
        found: !!matches,
        range: matches ? [matches.index, matches.index + matches[0].length - 1] : []
      }
    }
    this.reset()
    const textSelectors = 'p, a, li, h1, h2, h3, h4, h5, h6'
    document.querySelectorAll(textSelectors).forEach(el => {
      // Skip image
      if (el.childElementCount === 1 && el.children[0] instanceof HTMLImageElement) return
      let innerHTML = el.innerHTML
      texts.forEach(text => {
        const entityText = htmlEntities(text)
        // Find subsequent string entityText in innerHTML
        let result = found(entityText, innerHTML)
        if (result.found) {
          innerHTML =
            innerHTML.substring(0, result.range[0]) +
            "<span class='brain-cache-highlighted'>" +
            innerHTML.substring(result.range[0], result.range[1] + 1) +
            '</span>' +
            innerHTML.substring(result.range[1] + 1)
        }
      })
      el.innerHTML = innerHTML
    })
  }
}

async function fetchAndRender (serverUrl, authToken) {
  const url = document.location.href
  const page = new Page({ serverUrl, authToken })

  // Find page
  const pageData = await page.findBy({ url })
  page.update(pageData)
  page.render()

  // Highlight
  document.removeEventListener('keypress', () => {})
  document.addEventListener('keypress', (e) => {
    if (e.key === 'h' && !!page.highlighter.textSelected && !page.highlighter.isInput) {
      page.highlighter.update()
      page.highlighter.render(page.highlights)
    }
  })
}

chrome.storage.sync.get(['serverUrl', 'authToken', 'pages'], async (data) => {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.message === 'TabUpdated') {
      // Update page status: star, highlights
      fetchAndRender(data.serverUrl, data.authToken)
    }
  })

  fetchAndRender(data.serverUrl, data.authToken)
})
