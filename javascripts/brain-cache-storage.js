/**
 * Brain Cache Cookie API
 */
class BrainCacheStorage {
  static get cacheKey() {
    return 'BRAIN_CACHE_PAGES'
  }
}

BrainCacheStorage.getCookie = (name) => {
  let result = document.cookie.match(new RegExp(name + '=([^;]+)'))
  result && (result = JSON.parse(result[1]))
  return result
}

BrainCacheStorage.setCookie = (name, value) => {
  let now = new Date()
  let time = now.getTime()
  // Expire in one day
  let expireTime = time + 86400 * 1000
  now.setTime(expireTime)
  const cookie = `${name}=${JSON.stringify(value)}; domain=.${window.location.host.toString()}; path=/; expires=${now.toUTCString()};`
  document.cookie = cookie
}

BrainCacheStorage.add = (page) => {
  let pages = BrainCacheStorage.getCookie(BrainCacheStorage.cacheKey) || []
  pages = pages.filter(page => page.title !== title)
  pages.push({ id: page.id, title: page.title })
  BrainCacheStorage.setCookie(BrainCacheStorage.cacheKey, pages)
}

BrainCacheStorage.getPageByTitle = (title) => {
  let pages = BrainCacheStorage.getCookie(BrainCacheStorage.cacheKey) || []
  return pages.find(page => page.title === title)
}
