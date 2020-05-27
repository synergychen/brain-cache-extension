class Page {
  constructor({ serverUrl }) {
    this._serverUrl = serverUrl
    this._data = null
    this._highlights = []
    this._highlighter = new Highlighter({ serverUrl, page: this })
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
    })
    const page = await response.json()
    this.update(page)
    return page
  }

  async unstar() {
    const unstarUrl = `${this._serverUrl}/pages/${this.id}/unstar`
    const response = await fetch(unstarUrl, { method: 'DELETE' })
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
  constructor({ serverUrl, page }) {
    this._serverUrl = serverUrl
    this._page = page
  }

  get textSelected() { return document.getSelection().toString() }

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
    this.reset()
    const textSelectors = 'p, li, h1, h2, h3, h4, h5, h6'
    document.querySelectorAll(textSelectors).forEach(el => {
      let innerHTML = el.innerHTML
      texts.forEach(text => {
        let index = innerHTML.indexOf(text)
        if (index >= 0) {
          innerHTML =
            innerHTML.substring(0, index) +
            "<span class='brain-cache-highlighted'>" +
            innerHTML.substring(index, index + text.length) +
            '</span>' +
            innerHTML.substring(index + text.length)
        }
      })
      el.innerHTML = innerHTML
    })
  }
}

chrome.storage.sync.get(['serverUrl', 'pages'], async (data) => {
  const url = document.location.href
  const page = new Page({ serverUrl: data.serverUrl })

  // Find page
  const pageData = await page.findBy({ url })
  page.update(pageData)
  page.render()

  // Highlight
  document.addEventListener('keypress', (e) => {
    if (e.key === 'h' && !!page.highlighter.textSelected) {
      page.highlighter.update()
      page.highlighter.render(page.highlights)
    }
  })
})
