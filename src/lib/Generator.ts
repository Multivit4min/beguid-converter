import { Pool } from "promise-mysql"
import { Worker } from "worker_threads"
import { Configuration } from "../setup/config"
import path from "path"
import { Cache } from "./Cache"

export class Generator {
  private pool: Pool
  private cache: Cache
  private worker: Worker|null = null
  private config: Configuration
  private busy: boolean = false
  private workerPromise: Promise<void> = Promise.resolve()
  private lastInserted: bigint = -1n
  private generate: bigint = -1n

  constructor(init: Generator.Init) {
    this.pool = init.pool
    this.config = init.config
    this.cache = init.cache
  }

  /** initializes the generator with data from the database */
  async initialize() {
    this.lastInserted = await this.fetchCurrentMaxId()
    if (this.lastInserted > this.generate) this.generate = this.lastInserted
  }

  /** retrieves the current maximum used id */
  private async fetchCurrentMaxId() {
    const status = await this.getOverallTableStatus()
    return status.reduce((acc, curr) => acc + BigInt(curr.Rows), 0n) + BigInt(this.config.converter.offset) - 1n
  }

  /** retrieves the mysql table status of all tables */
  private getOverallTableStatus(): Promise<Record<string, any>[]> {
    const tableName = this.config.mysql.table.replace(/_/g, "\\_")
    return this.pool.query(`SHOW table status WHERE Name LIKE '${tableName}_'`)
  }

  /** check if the genertor is currently working */
  isBusy() {
    return this.busy
  }

  /** adds a new amount of data to generate */
  generateAmount(amount: bigint) {
    if (this.isBusy()) throw new Error("there is already a job running, can not add more till the current job has finnished")
    if (amount < 0n) return this
    this.generate += amount
    return this
  }

  /** sets a new amount of data to generate */
  generateUntil(till: bigint) {
    if (this.isBusy()) throw new Error("there is already a job running, can not add more till the current job has finnished")
    if (till < this.lastInserted) return this
    this.generate = till
    return this
  }

  /** starts the generator */
  start() {
    if (this.lastInserted >= this.generate) return this
    this.workerPromise = this.startWorker()
    return this.workerPromise
  }

  /* starts the worker thread to generate new ids */
  private startWorker() {
    return new Promise<void>(fulfill => {
      this.worker = new Worker(path.join(__dirname, "../worker.js"), { workerData: this.getWorkerData() })
      this.worker.once("exit", async () => {
        this.worker = null
        //clear all items in cache which are null
        //its possible that one or more of those have been generated
        await this.cache.clearNullItems()
        fulfill()
      })
    })
  }

  /* retrieves data for the worker */
  private getWorkerData() {
    return {
      config: this.config,
      lastInserted: this.lastInserted,
      generate: this.generate
    }
  }

}

export namespace Generator {
  export interface Init {
    pool: Pool
    cache: Cache
    config: Configuration
  }
  export interface WorkerData {
    lastInserted: bigint
    generate: bigint
  }
}