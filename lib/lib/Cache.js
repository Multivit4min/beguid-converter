"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
class Cache {
    constructor(config) {
        this.items = {};
        this.interval = null;
        this.config = config;
    }
    /** initializes the cache */
    async initialize() {
        clearInterval(this.interval);
        await this.loadFromDisk();
        this.interval = setInterval(() => this.saveToCache(), this.config.data.cache.saveInterval);
    }
    /**
     * loads cached data from disk
     */
    async loadFromDisk() {
        let items = [];
        try {
            items = JSON.parse(await fs_1.promises.readFile(this.config.internals.cacheFile, "utf8"));
        }
        catch (e) {
            console.log("tried to load corrupted cache file, file will be resetted!", e);
        }
        items.forEach(data => {
            const item = CacheItem.from(data);
            this.items[item.getGuid()] = item;
        });
    }
    async saveToCache() {
        const items = Object.values(this.items)
            .filter(item => item.isValid() ? true : (delete this.items[item.getGuid()], false))
            .map(item => item.serialize());
        try {
            await fs_1.promises.writeFile(this.config.internals.cacheFile, JSON.stringify(items), "utf-8");
        }
        catch (e) {
            console.log(`error while trying to write file ${this.config.internals.cacheFile}`);
            console.log(e);
        }
    }
    /**
     * tries to get an item from the current cache
     * @param guid the guid to search for
     */
    findGuid(guid) {
        const item = this.items[guid];
        if (!item)
            return false;
        item.refresh(this.config.data.cache.keepTime);
        return item.incrementCounter().getSteamId();
    }
    /**
     * adds a new guid and steamid pair to the cache
     * @param guid
     * @param steamid
     */
    addItem(guid, steamid) {
        steamid = typeof steamid === "bigint" ? steamid.toString() : steamid;
        const item = CacheItem.from([guid, steamid, Date.now() + this.config.data.cache.keepTime]);
        this.items[item.getGuid()] = item;
        return this.items[item.getGuid()];
    }
    /** comparator function to find sort by most used CacheItems */
    compareTop(a, b) {
        if (a.getCounter() === b.getCounter())
            return 0;
        if (a.getCounter() < b.getCounter())
            return -1;
        return 1;
    }
    /**
     * retrieves the top most retrieved items
     * @param limit how much items should be retrieved
     */
    getTopRequested(limit = 10) {
        return Object.values(this.items)
            .sort(this.compareTop.bind(this))
            .reverse()
            .slice(0, limit);
    }
    /**
     * retrieves overall cache stats
     * @param limit how much items should be retrieved for topRequested
     */
    getStats(limit = 10) {
        return {
            totalEntries: Object.keys(this.items).length,
            topRequested: this.getTopRequested(limit).map(item => item.serialize())
        };
    }
}
exports.Cache = Cache;
class CacheItem {
    constructor(item) {
        this.guid = item.guid;
        this.steamid = item.steamid;
        this.collectTime = item.collectTime;
        this.counter = item.counter;
    }
    static from([guid, steamid, collectTime, counter]) {
        return new CacheItem({
            guid,
            steamid: BigInt(steamid),
            collectTime,
            counter: counter || 0
        });
    }
    serialize() {
        return [this.guid, this.steamid.toString(10), this.collectTime, this.counter];
    }
    refresh(duration) {
        this.collectTime = Date.now() + duration;
    }
    isValid() {
        return Date.now() < this.collectTime;
    }
    getGuid() {
        return this.guid;
    }
    getSteamId() {
        return this.steamid;
    }
    getCounter() {
        return this.counter;
    }
    incrementCounter() {
        this.counter++;
        return this;
    }
}
exports.CacheItem = CacheItem;
