const textSelected = () => {
  return document.getSelection().toString()
}

const highlight = ({ title, text }) => {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get('serverUrl', (data) => {
      const id = BrainCacheCookie.getPageByTitle(title).id
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

document.addEventListener('mouseup', () => {
  const text = textSelected()
  if (!!text) {
    console.log(text)
  }
})

document.addEventListener('keypress', (e) => {
  if (e.key === 'h' && !!textSelected()) {
    // Send text selection to server
    const title = document.querySelector('title').innerText
    highlight({ title, text: textSelected() }).then(data => {
      console.log(data)
    })
  }
})
