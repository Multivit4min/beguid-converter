import { Pool } from "promise-mysql"
import { BEGuid } from "./BEGuid"
import { ValidSuffix, getTableName } from "../setup/mysql"
import { Configuration } from "../setup/config"

export class GeneratorWorker {
  private pool: Pool
  private offset: bigint
  private guidlen: number
  private lastInserted: bigint
  private generateUntil: bigint
  private batchSize: number
  private batch: Record<ValidSuffix, Batch>

  constructor(init: GeneratorWorker.Init) {
    this.pool = init.pool
    this.offset = BigInt(init.config.converter.offset)
    this.guidlen = init.config.converter.byteLength
    this.batchSize = Number(init.config.converter.insertBatchSize)
    this.lastInserted = init.lastInserted
    this.generateUntil = init.generateUntil
    this.batch = this.initializeEmptyBatch()
  }

  private initializeEmptyBatch(): Record<ValidSuffix, Batch> {
    //@ts-ignore
    return Object.fromEntries(Array(16).fill(null).map((_, i) => [
      <ValidSuffix>i.toString(16), 
      new Batch({
        pool: this.pool,
        batchSize: this.batchSize,
        suffix: <ValidSuffix>i.toString(16),
        guidlen: this.guidlen
      })
    ]))
  }
  async run() {
    while (true) {
      const suffix = this.generateBatch()
      if (typeof suffix === "boolean") {
        await Promise.all(Object.values(this.batch).map(b => b.dispatch()))
        return console.log("done all")
      } else {
        console.log({ suffix })
        await this.batch[suffix].dispatch()
      }
    }
  }

  private generateBatch(): ValidSuffix|boolean {
    while (true) {
      const next = this.getNextId()
      const s = <ValidSuffix>next[1][0]
      this.batch[s].push(next)
      //console.log({ suffix: s, count: this.batch[s].getCount() })
      if (this.hasCalculationAmountReached()) return true
      if (this.batch[s].isFull()) return s
    }
  }

  private hasCalculationAmountReached() {
    return this.lastInserted + this.countInCollector() >= this.generateUntil
  }

  private countInCollector() {
    return Object.values(this.batch).reduce((curr, acc) => curr + BigInt(acc.getCount()), 0n)
  }


  private getNextId(): Batch.Item {
    return [++this.lastInserted-this.offset, BEGuid.toBattleyeUID(this.lastInserted)]
  }
}

export namespace GeneratorWorker {
  export interface Init {
    pool: Pool
    config: Configuration
    lastInserted: bigint
    generateUntil: bigint
  }
}

class Batch {
  private items: Batch.Item[] = []
  private count: number = 0
  private pool: Pool
  private readonly tableName: string
  private readonly batchSize: number
  private readonly guidlen: number 
  private busy: Promise<any> = Promise.resolve()

  constructor(init: Batch.Init) {
    this.pool = init.pool
    this.batchSize = init.batchSize
    this.guidlen = init.guidlen
    this.tableName = getTableName(init.suffix)
  }

  /** creates an insert statement and clears the batch */
  private createInsertAndClean() {
    const stmt = this.createInsertStatement()
    this.emptyBatch()
    return stmt
  }

  /** sends the batch to database */
  async dispatch() {
    await this.busy
    this.busy = this.pool.query(this.createInsertAndClean())
    return this.busy
  }

  /** checks if the batch is full */
  isFull() {
    return this.count >= this.batchSize
  }

  /** gets the item count in this batch */
  getCount() {
    return this.count
  }

  /** adds a new item to the queue */
  push(item: Batch.Item) {
    this.items.push(item)
    return ++this.count
  }

  /** clears the batch instance */
  private emptyBatch() {
    this.count = 0
    this.items = []
  }

  /** creates an insert SQL statement for selected suffix */
  private createInsertStatement() {
    let stmt = `INSERT INTO ${this.tableName} (steamid, guid) VALUES `
    stmt += this.items.map(([id, guid]) => `(${Number(id)},UNHEX('${guid.substr(1, this.guidlen)}'))`).join(",")
    return stmt
  }
}

export namespace Batch {
  export interface Init {
    pool: Pool
    batchSize: number
    suffix: ValidSuffix
    guidlen: number
  }
  export type Item = [bigint, string]
}