import { Pool } from "promise-mysql"
import { BEGuid } from "./BEGuid"
import { Configuration } from "../setup/config"

export class Generator {
  private pool: Pool
  private beguid: BEGuid
  private config: Configuration
  private busy: boolean = false
  private lastInserted: bigint = -1n

  constructor(init: Generator.Init) {
    this.pool = init.pool
    this.beguid = init.beguid
    this.config = init.config
  }

  async initialize() {
    this.lastInserted = await this.fetchCurrentMaxId()
  }

  private async fetchCurrentMaxId() {
    const status = await this.getOverallTableStatus()
    return status.reduce((acc, curr) => acc + BigInt(curr.Rows), 0n)
  }

  private getOverallTableStatus(): Promise<Record<string, any>[]> {
    const tableName = this.config.mysql.table.replace(/_/g, "\\_")
    return this.pool.query(`SHOW table status WHERE Name LIKE '${tableName}_'`)
  }

  stop() {
    this.busy = false
  }

  start() {
    this.busy = true
  }

}

export namespace Generator {
  export interface Init {
    pool: Pool
    beguid: BEGuid
    config: Configuration
  }
}