const textSelected = () => {
  return document.getSelection().toString()
}

const addHighlight = ({ title, text }) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('serverUrl', (data) => {
      const id = BrainCacheStorage.getPageByTitle(title).id
      const highlightUrl = `${data.serverUrl}/pages/${id}/highlight`
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
  })
}

const resetHighlights = () => {
  document.querySelectorAll('.brain-cache-highlighted').forEach((el) => {
    if (el.parentElement) {
      el.parentElement.innerText = el.parentElement.innerText
    }
  })
}

const removeHighlight = ({ title, text }) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('serverUrl', (data) => {
      const id = BrainCacheStorage.getPageByTitle(title).id
      const unhighlightUrl = `${data.serverUrl}/pages/${id}/unhighlight`
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
  })
}

const highlightTexts = (texts) => {
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

const isSelectedTextHighlighted = () => {
  const selection = document.getSelection().getRangeAt(0)
  const parentEl = selection.startContainer.parentElement
  return parentEl.classList.contains('brain-cache-highlighted') && parentEl.innerText.includes(selection.toString())
}

document.addEventListener('keypress', (e) => {
  if (e.key === 'h' && !!textSelected()) {
    const title = document.querySelector('title').innerText
    const text = textSelected()
    if (isSelectedTextHighlighted()) {
      // Remove highlight
      resetHighlights()
      removeHighlight({ title, text }).then(page => {
        highlightTexts(page.metadata.highlights)
      })
    } else {
      // Add highlight
      addHighlight({ title, text }).then(page => {
        highlightTexts(page.metadata.highlights)
      })
    }
  }
})
