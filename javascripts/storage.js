/**
 * Brain Cache Cookie API
 */
class Storage {
  static get cacheKey() {
    return 'BRAIN_CACHE_PAGES'
  }
}

Storage.getCookie = (name) => {
  let result = document.cookie.match(new RegExp(name + '=([^;]+)'))
  result && (result = JSON.parse(result[1]))
  return result
}

Storage.setCookie = (name, value) => {
  let now = new Date()
  let time = now.getTime()
  // Expire in one day
  let expireTime = time + 86400 * 1000
  now.setTime(expireTime)
  const cookie = `${name}=${JSON.stringify(value)}; domain=.${window.location.host.toString()}; path=/; expires=${now.toUTCString()};`
  document.cookie = cookie
}

Storage.add = (page) => {
  let pages = Storage.getCookie(Storage.cacheKey) || []
  pages = pages.filter(pg => pg.title !== page.title)
  pages.push({ id: page.id, title: page.title })
  Storage.setCookie(Storage.cacheKey, pages)
}

Storage.remove = (page) => {
  let pages = Storage.getCookie(Storage.cacheKey) || []
  pages = pages.filter(pg => pg.title !== page.title)
  Storage.setCookie(Storage.cacheKey, pages)
}

Storage.getPageByTitle = (title) => {
  let pages = Storage.getCookie(Storage.cacheKey) || []
  return pages.find(page => page.title === title)
}
