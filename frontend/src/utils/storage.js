class StorageManager {
  constructor() {
    this.isAvailable = this.checkAvailability()
  }

  checkAvailability() {
    try {
      const test = '__storage_test__'
      localStorage.setItem(test, test)
      localStorage.removeItem(test)
      return true
    } catch (e) {
      return false
    }
  }

  set(key, value, expiry = null) {
    if (!this.isAvailable) return false

    try {
      const item = {
        value,
        timestamp: Date.now(),
        expiry: expiry ? Date.now() + expiry : null
      }
      localStorage.setItem(key, JSON.stringify(item))
      return true
    } catch (error) {
      console.error('Storage set error:', error)
      return false
    }
  }

  get(key) {
    if (!this.isAvailable) return null

    try {
      const itemStr = localStorage.getItem(key)
      if (!itemStr) return null

      const item = JSON.parse(itemStr)

      // Check if item has expired
      if (item.expiry && Date.now() > item.expiry) {
        this.remove(key)
        return null
      }

      return item.value
    } catch (error) {
      console.error('Storage get error:', error)
      return null
    }
  }

  remove(key) {
    if (!this.isAvailable) return false

    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.error('Storage remove error:', error)
      return false
    }
  }

  clear() {
    if (!this.isAvailable) return false

    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.error('Storage clear error:', error)
      return false
    }
  }

  // Get all keys with a specific prefix
  getKeys(prefix = '') {
    if (!this.isAvailable) return []

    const keys = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && key.startsWith(prefix)) {
        keys.push(key)
      }
    }
    return keys
  }

  // Get storage usage info
  getUsage() {
    if (!this.isAvailable) return null

    let totalSize = 0
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length
      }
    }

    return {
      used: totalSize,
      usedFormatted: this.formatBytes(totalSize),
      itemCount: localStorage.length
    }
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes'

    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB']

    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }
}

// Create and export singleton instance
export const storage = new StorageManager()

// Export individual methods for convenience
export const setItem = (key, value, expiry) => storage.set(key, value, expiry)
export const getItem = (key) => storage.get(key)
export const removeItem = (key) => storage.remove(key)
export const clearStorage = () => storage.clear()
