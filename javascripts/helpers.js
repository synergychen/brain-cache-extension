class BrainCacheCookie {
  static get cacheKey() {
    return 'BRAIN_CACHE_PAGES'
  }
}

BrainCacheCookie.getCookie = (name) => {
  let result = document.cookie.match(new RegExp(name + '=([^;]+)'))
  result && (result = JSON.parse(result[1]))
  return result
}

BrainCacheCookie.setCookie = (name, value) => {
  let now = new Date()
  let time = now.getTime()
  // Expire in one day
  let expireTime = time + 86400 * 1000
  now.setTime(expireTime)
  const cookie = `${name}=${JSON.stringify(value)}; domain=.${window.location.host.toString()}; path=/; expires=${now.toUTCString()};`
  document.cookie = cookie
}

BrainCacheCookie.add = (page) => {
  let pages = BrainCacheCookie.getCookie(BrainCacheCookie.cacheKey) || []
  pages = pages.filter(page => page.title !== title)
  pages.push({ id: page.id, title: page.title })
  BrainCacheCookie.setCookie(BrainCacheCookie.cacheKey, pages)
}

BrainCacheCookie.getPageByTitle = (title) => {
  let pages = BrainCacheCookie.getCookie(BrainCacheCookie.cacheKey) || []
  return pages.find(page => page.title === title)
}
