const EventEmitter = require("events")

class Generator extends EventEmitter {
  constructor() {
    super()
    this.calculating = false
    this.current = 0n
    this.amount = 0n
    this.offset = 76561197960265730n
    this.batchsize = 10000n
    this.table = null
    this.pool = null
    this.guidlen = -1
    this.timer = {
      calculating: 0,
      mysql: 0,
      start: 0
    }
  }

  setGuidLength(len) {
    if (typeof len !== "number") throw new Error(`expected a number but got ${typeof len}`)
    this.guidlen = len
    return this
   }

  setOffset(offset) {
    if (typeof offset !== "bigint") throw new Error(`expected a bigint but got ${typeof offset}`)
    this.offset = offset
    return this
  }

  setStart(index) {
    if (typeof index !== "bigint") throw new Error(`expected a bigint but got ${typeof index}`)
    if (this.calculating) throw new Error("can not change start while generating")
    this.current = index
    return this
  }

  setTableName(name) {
    if (typeof name !== "string") throw new Error(`expected a string but got ${typeof name}`)
    this.table = name
    return this
  }

  setPool(pool) {
    this.pool = pool
    return this
  }

  setBatchSize(size) {
    if (size < 1n) throw new Error(`batchsize needs to be 1 or greater but got ${size}`)
    this.batchsize = size
    return this
  }

  add(amount) {
    if (typeof amount !== "bigint") throw new Error(`expected a bigint but got ${typeof amount}`)
    this.amount += amount
    return this
  }

  _calculate(start, amount) {
    var timer = Date.now()
    var result = {}
    Array(Number(amount)).fill().forEach(() => {
      result[String((start+this.offset).toBattleyeUID())] = start
      start++
    })
    this.timer.calculating = Date.now() - timer
    return result
  }

  isBusy() {
    return this.calculating
  }

  run() {
    if (this.isBusy()) throw new Error("Can not start run job, generator is busy!")
    if (this.pool === null || this.table === null)
      throw new Error("set pool and table name before starting the generator")
    this.calculating = true
    this.timer.start = Date.now()
    var mysqltimer = Date.now()
    return new Promise(async (fulfill, reject) => {
      try {
        var resolver = Promise.resolve()
        while (this.amount > 0) {
          var amount = (this.amount < this.batchsize) ? this.amount : this.batchsize
          var res = this._calculate(this.current, amount)
          var str = `INSERT INTO ${this.table} (steamid, guid) VALUES `
          str += Object.keys(res).map(k => `(${Number(res[k])},UNHEX('${k.substr(0,this.guidlen)}'))`).join(",")
          await resolver
          this.timer.mysql = Date.now() - mysqltimer
          mysqltimer = Date.now()
          resolver = this.pool.query(str)
          this.current += amount
          this.amount -= amount
          this.emit("batch", { timer: this.timer, remaining: this.amount, lastinserted: this.current })
        }
      } catch (e) {
        this.calculating = false
        return reject(e)
      }
      this.calculating = false
      fulfill({ duration: Date.now() - this.timer.start })
    })
  }
}

module.exports = Generator
