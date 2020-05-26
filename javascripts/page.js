class Page {
  constructor({ serverUrl }) {
    this._serverUrl = serverUrl
    this._data = null
    this._highlights = []
    this._highlighter = new Highlighter({ serverUrl, page: this })
  }

  get data() { return this._data }

  set data(dat) { this._data = dat }

  get highlights() {
    if (!this._data) return []
    return this._data.metadata.highlights
  }

  get highlighter() { return this._highlighter }

  findBy({ url }) {
    return new Promise((resolve, reject) => {
      const searchUrl = `${this._serverUrl}/pages/search?url=${url}`
      let xhr = new XMLHttpRequest()
      xhr.open('GET', searchUrl)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          const page = JSON.parse(this.responseText)
          if (!!page) {
            Storage.add(page)
          }
          return resolve(page)
        }
      }
      xhr.send()
    })
  }

  star() {
    return new Promise((resolve, reject) => {
      const starUrl = `${this._serverUrl}/star`
      const title = document.querySelector('title').innerText
      const url = document.location.href
      const content = document.querySelector('body').innerText
      const visitedAt = new Date().toString()
      const payload = {
        title: title,
        url: url,
        content: content,
        visited_at: visitedAt
      }
      let xhr = new XMLHttpRequest()
      xhr.open('POST', starUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          const page = JSON.parse(this.responseText)
          this._data = page
          Storage.add(page)
          return resolve(page)
        }
      }
      xhr.send(JSON.stringify(payload))
    })
  }

  unstar() {
    return new Promise((resolve, reject) => {
      const title = document.querySelector('title').innerText
      const unstarUrl = `${this._serverUrl}/unstar?title=${title}`
      let xhr = new XMLHttpRequest()
      xhr.open('DELETE', unstarUrl, true)
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          const page = JSON.parse(this.responseText)
          Storage.remove({ title })
          return resolve(page)
        }
      }
      xhr.send(null)
    })
  }

  appendStar() {
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
        this.unstar()
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

  add({ title, text }) {
    return new Promise((resolve, reject) => {
      const id = Storage.getPageByTitle(title).id
      const highlightUrl = `${this._serverUrl}/pages/${id}/highlight`
      const payload = { text }
      let xhr = new XMLHttpRequest()
      xhr.open('POST', highlightUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          return resolve(JSON.parse(this.responseText))
        }
      }
      xhr.send(JSON.stringify(payload))
    })
  }

  remove({ title, text }) {
    return new Promise((resolve, reject) => {
      const id = Storage.getPageByTitle(title).id
      const unhighlightUrl = `${this._serverUrl}/pages/${id}/unhighlight`
      const payload = { text }
      let xhr = new XMLHttpRequest()
      xhr.open('POST', unhighlightUrl, true)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          return resolve(JSON.parse(this.responseText))
        }
      }
      xhr.send(JSON.stringify(payload))
    })
  }

  reset() {
    document.querySelectorAll('.brain-cache-highlighted').forEach((el) => {
      if (el.parentElement) {
        el.parentElement.innerText = el.parentElement.innerText
      }
    })
  }

  render(texts) {
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

chrome.storage.sync.get(['serverUrl', 'pages'], (data) => {
  const url = document.location.href
  const title = document.querySelector('title').innerText
  const page = new Page({ serverUrl: data.serverUrl })

  // Find page and append star
  page.findBy({ url })
    .then((pageData) => {
      page.data = pageData
      page.appendStar()
      // Highlight texts
      if (page.data) {
        page.highlighter.render(page.highlights)
      }
    })

  // Highlight
  document.addEventListener('keypress', (e) => {
    if (e.key === 'h' && !!page.highlighter.textSelected) {
      const text = page.highlighter.textSelected
      if (page.highlighter.selectionHighlighted) {
        // Remove highlight
        page.highlighter.reset()
        page.highlighter.remove({ title, text }).then(pg => {
          page.data = pg
          page.highlighter.render(page.highlights)
        })
      } else {
        // Add highlight
        if (Storage.getPageByTitle(title)) {
          page.highlighter.add({ title, text }).then(pg => {
            page.data = pg
            page.highlighter.render(page.highlights)
          })
        } else {
          page.star()
            .then(pg => {
              page.highlighter.add({ title, text }).then(pg => {
                page.data = pg
                page.highlighter.render(page.highlights)
              })
            })
        }
      }
    }
  })
})
