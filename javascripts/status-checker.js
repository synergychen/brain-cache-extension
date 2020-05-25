const findPage = ({ title }) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('serverUrl', (data) => {
      const searchUrl = `${data.serverUrl}/pages/search?title=${title}`
      let xhr = new XMLHttpRequest()
      xhr.open('GET', searchUrl)
      xhr.setRequestHeader('Content-Type', 'application/jsoncharset=UTF-8')
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          const page = JSON.parse(this.responseText)
          if (!!page) {
            BrainCacheCookie.add(page)
          }
          return resolve(page)
        }
      }
      xhr.send()
    })
  })
}

const star = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('serverUrl', (data) => {
      const starUrl = `${data.serverUrl}/star`
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
          return resolve(JSON.parse(this.responseText))
        }
      }
      xhr.send(JSON.stringify(payload))
    })
  })
}

const unstar = () => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['serverUrl', 'pages'], (data) => {
      const title = document.querySelector('title').innerText
      const unstarUrl = `${data.serverUrl}/unstar?title=${title}`
      let xhr = new XMLHttpRequest()
      xhr.open('DELETE', unstarUrl, true)
      xhr.onreadystatechange = function() {
        if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
          return resolve(JSON.parse(this.responseText))
        }
      }
      xhr.send(null)
    })
  })
}

const title = document.querySelector('title').innerText
findPage({ title })
  .then((response) => {
    const isSolid = !!response
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
        unstar()
      } else {
        // Not saved yet
        starEl.removeAttribute('class')
        starEl.setAttribute('class', solidClass)
        star()
      }
    })
    const el = document.createElement('div')
    el.setAttribute('id', 'brain-cache-star-wrapper')
    el.append(starEl)
    document.querySelector('body').append(el)
  })