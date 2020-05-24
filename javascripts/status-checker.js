const findPage = ({ serverUrl, title }) => {
  return new Promise((resolve, reject) => {
    const searchUrl = `${serverUrl}/pages/search?title=${title}`;
    let xhr = new XMLHttpRequest();
    xhr.open('GET', searchUrl);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        return resolve(JSON.parse(this.responseText));
      }
    }
    xhr.send();
  });
}

const star = ({ serverUrl }) => {
  return new Promise((resolve, reject) => {
    const starUrl = `${serverUrl}/star`;
    const title = document.querySelector('title').innerText;
    const url = document.location.href;
    const content = document.querySelector('body').innerText;
    const visitedAt = new Date().toString();
    const payload = {
      title: title,
      url: url,
      content: content,
      visited_at: visitedAt
    };
    let xhr = new XMLHttpRequest();
    xhr.open('POST', starUrl, true);
    xhr.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        return resolve(JSON.parse(this.responseText));
      }
    }
    xhr.send(JSON.stringify(payload));
  });
}

const unstar = ({ serverUrl }) => {
  return new Promise((resolve, reject) => {
    const title = document.querySelector('title').innerText;
    const unstarUrl = `${serverUrl}/unstar?title=${title}`;
    let xhr = new XMLHttpRequest();
    xhr.open('DELETE', unstarUrl, true);
    xhr.onreadystatechange = function() {
      if (this.readyState === XMLHttpRequest.DONE && this.status === 200) {
        return resolve(JSON.parse(this.responseText));
      }
    }
    xhr.send(null);
  });
}

chrome.storage.sync.get('serverUrl', (data) => {
  const serverUrl = data.serverUrl || '';
  const title = document.querySelector('title').innerText;
  findPage({ serverUrl, title })
    .then((response) => {
      const isSolid = !!response;
      const hollowClass = 'brain-cache-star-hollow';
      const solidClass = 'brain-cache-star-solid';
      const starEl = document.createElement('span');
      starEl.setAttribute('class', isSolid ? solidClass : hollowClass);
      starEl.addEventListener('click', () => {
        const hasSolidClass = starEl.getAttribute('class') === solidClass;
        if (hasSolidClass) {
          // Already saved
          starEl.removeAttribute('class');
          starEl.setAttribute('class', hollowClass);
          unstar({ serverUrl })
        } else {
          // Not saved yet
          starEl.removeAttribute('class');
          starEl.setAttribute('class', solidClass);
          star({ serverUrl })
        }
      });
      const el = document.createElement('div');
      el.setAttribute('id', 'brain-cache-star-wrapper');
      el.append(starEl);
      document.querySelector('body').append(el);
    });
});
