import { promises as fs } from "fs"
import { Configuration } from "../setup/config"

export class Cache {
  
  private config: Configuration
  private items: Record<string, CacheItem> = {}
  private interval: any = null

  constructor(config: Configuration) {
    this.config = config
  }

  /** initializes the cache */
  async initialize() {
    clearInterval(this.interval)
    await this.loadFromDisk()
    this.interval = setInterval(() => this.saveToCache(), this.config.data.cache.saveInterval)
  }

  /**
   * loads cached data from disk
   */
  private async loadFromDisk() {
    let items: CacheItem.Serialized[] = []
    try {
      items = JSON.parse(await fs.readFile(this.config.internals.cacheFile, "utf8"))
    } catch (e) {
      console.log("tried to load corrupted cache file, file will be resetted!", e)
    }
    items.forEach(data => {
      const item = CacheItem.from(data)
      this.items[item.getGuid()] = item
    })
  }

  private async saveToCache() {
    const items = Object.values(this.items)
      .filter(item => item.isValid() ? true : (delete this.items[item.getGuid()], false))
      .map(item => item.serialize())
    try {
      await fs.writeFile(this.config.internals.cacheFile, JSON.stringify(items), "utf-8")
    } catch (e) {
      console.log(`error while trying to write file ${this.config.internals.cacheFile}`)
      console.log(e)
    }
  }

  /**
   * removes all items from cache which are null
   */
  async clearNullItems() {    
    Object.values(this.items)
      .filter(item => item.isNull())
      .forEach(item => delete this.items[item.getGuid()])
    await this.saveToCache()
    return this
  }

  /**
   * tries to get an item from the current cache
   * @param guid the guid to search for
   */
  findGuid(guid: string) {
    const item = this.items[guid]
    if (!item) return false
    return item
    .refresh(this.config.data.cache.keepTime)
    .incrementCounter()
    .getSteamId()
  }

  /**
   * adds a new guid and steamid pair to the cache
   * @param guid 
   * @param steamid 
   */
  addItem(guid: string, steamid: string|bigint|null) {
    steamid = typeof steamid === "bigint" ? steamid.toString() : steamid
    const item = CacheItem.from([guid, steamid, Date.now() + this.config.data.cache.keepTime])
    this.items[item.getGuid()] = item
    return this.items[item.getGuid()]
  }

  /** comparator function to find sort by most used CacheItems */
  private compareTop(a: CacheItem, b: CacheItem) {
    if (a.getCounter() === b.getCounter()) return 0
    if (a.getCounter() < b.getCounter()) return -1
    return 1
  }

  /**
   * retrieves the top most retrieved items
   * @param limit how much items should be retrieved
   */
  getTopRequested(limit = 10) {
    return Object.values(this.items)
      .sort(this.compareTop.bind(this))
      .reverse()
      .slice(0, limit)
  }

  /**
   * retrieves overall cache stats
   * @param limit how much items should be retrieved for topRequested
   */
  getStats(limit = 10) {
    return {
      totalEntries: Object.keys(this.items).length,
      topRequested: this.getTopRequested(limit).map(item => item.serialize())
    }
  }
}

export class CacheItem {

  guid: string
  steamid: string|null
  collectTime: number
  counter: number

  constructor(item: CacheItem.Init) {
    this.guid = item.guid
    this.steamid = item.steamid
    this.collectTime = item.collectTime
    this.counter = item.counter
  }

  static from([guid, steamid, collectTime, counter]: CacheItem.Serialized) {
    return new CacheItem({
      guid,
      steamid,
      collectTime,
      counter: counter || 1
    })
  }

  serialize() {
    return [this.guid, this.steamid, this.collectTime, this.counter]
  }

  refresh(duration: number) {
    this.collectTime = Date.now() + duration
    return this
  }

  isNull() {
    return this.steamid === null
  }

  isValid() {
    return Date.now() < this.collectTime
  }

  getGuid() {
    return this.guid
  }

  getSteamId() {
    return this.steamid
  }

  getCounter() {
    return this.counter
  }

  incrementCounter() {
    this.counter++
    return this
  }
}

export namespace CacheItem {
  export type Serialized = [string, string|null, number, number?]
  export interface Init {
    steamid: string|null
    guid: string
    counter: number
    collectTime: number
  } 
}