const fs = require("fs")

class Cache {
  constructor(config) {
    this.items = []
    this.save_interval = config.save_interval
    this.keep_time = config.keep_time
    this.saveFile = config.saveFile
    this.interval = setInterval(this._saveToCache.bind(this), config.save_interval)
    this._loadFromCache()
  }

  _loadFromCache() {
    JSON.parse(fs.readFileSync(this.saveFile, "utf8")).map(data => {
      var item = new CacheItem()
      item.deserialize(data)
      if (!item.isValid()) return
      this.items[item.getGuid()] = item
    })
  }

  _saveToCache() {
    var data = Object
      .values(this.items)
      .filter(item => {
        if (item.isValid()) return true
        delete this.items[item.getGuid()]
        return false
      })
      .map(item => item.serialize())
    fs.writeFile(this.saveFile, JSON.stringify(data), err => {
      if (!err) return
      console.error(`Error while trying to write file ${this.saveFile}`)
      console.error(e)
    })
  }

  findGuid(guid) {
    var item = this.items[guid]
    if (!item) return false
    item.refresh(this.keep_time)
    return item.incrementCounter().getSteamId()
  }

  addGuid(guid, steamid) {
    var item = this.items[guid]
    if (item) return (item.refresh(this.keep_time), item)
    item = new CacheItem()
    item
      .setGuid(guid)
      .setSteamId(steamid)
      .refresh(this.keep_time)
    this.items[item.getGuid()] = item
    return item
  }

  _compareTop(a, b) {
    if (a.getCounter() === b.getCounter()) return 0
    if (a.getCounter() < b.getCounter()) return -1
    return 1
  }

  getTopRequested(limit = 10) {
    return Object.values(this.items)
      .sort(this._compareTop.bind(this))
      .reverse()
      .slice(0, limit)
  }

  getStats(limit = 10) {
    return {
      totalEntries: Object.keys(this.items).length,
      topRequested: this.getTopRequested(limit).map(item => item.serialize())
    }
  }
}

class CacheItem {
  constructor() {
    this.guid = null
    this.steamid = null
    this.collectTime = null
    this.counter = 0
  }

  refresh(duration) {
    this.collectTime = Date.now() + duration
  }

  serialize() {
    return [this.guid, String(this.steamid), this.collectTime, this.counter]
  }

  deserialize([guid, steamid, collectTime, counter]) {
    this.guid = guid
    this.steamid = steamid === "null" ? null : BigInt(steamid)
    this.collectTime = collectTime
    this.counter = counter
    return this
  }

  isValid() {
    return Date.now() < this.collectTime
  }

  setSteamId(steamid) {
    this.steamid = steamid
    return this
  }

  setGuid(guid) {
    this.guid = guid
    return this
  }

  getGuid() {
    return this.guid
  }

  getCounter() {
    return this.counter
  }

  incrementCounter() {
    this.counter++
    return this
  }

  getSteamId() {
    return this.steamid
  }
}

module.exports = {
  Cache,
  CacheItem
}
