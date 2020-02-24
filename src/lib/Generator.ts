import { Pool } from "promise-mysql"
import { Worker } from "worker_threads"
import { BEGuid } from "./BEGuid"
import { Configuration } from "../setup/config"
import path from "path"

export class Generator {
  private pool: Pool
  private beguid: BEGuid
  private worker: Worker|null = null
  private config: Configuration
  private busy: boolean = false
  private lastInserted: bigint = -1n
  private generateUntil: bigint = -1n

  constructor(init: Generator.Init) {
    this.pool = init.pool
    this.beguid = init.beguid
    this.config = init.config
  }

  /** initializes the generator with data from the database */
  async initialize() {
    this.lastInserted = await this.fetchCurrentMaxId()
    if (this.lastInserted > this.generateUntil) this.generateUntil = this.lastInserted
  }

  /** retrieves the current maximum used id */
  private async fetchCurrentMaxId() {
    const status = await this.getOverallTableStatus()
    return status.reduce((acc, curr) => acc + BigInt(curr.Rows), 0n)
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
    this.generateUntil += amount
    return this
  }

  /** sends a stop request to the generator */
  stop() {
    this.busy = false
    return this
  }

  /** starts the generator */
  start() {
    if (this.lastInserted >= this.generateUntil) return this
    this.busy = true
    this.startWorker()
    return this
  }

  private startWorker() {
    this.worker = new Worker(path.join(__dirname, "../worker.js"))
    this.worker.once("exit", () => {
      this.busy = false
      this.worker = null
      console.log("worker exited")
    })
  }

}

export namespace Generator {
  export interface Init {
    pool: Pool
    beguid: BEGuid
    config: Configuration
  }
}