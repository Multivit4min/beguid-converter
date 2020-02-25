import { createHash } from "crypto"
import { Pool } from "promise-mysql"
import { Cache } from "../lib/Cache"
import { Configuration } from "../setup/config"
import { ValidSuffix, getTableName } from "../setup/mysql"

export class BEGuid {

  private pool: Pool
  private cache: Cache
  private config: Configuration

  constructor(init: BEGuid.Init) {
    this.pool = init.pool
    this.cache = init.cache
    this.config = init.config
  }

  /**
   * tries to retrieve a single uid from the database
   * @param uid the battleyeuid to search for
   */
  async convertBattleyeUID(uid: string) {
    uid = uid.toLowerCase()
    if (!BEGuid.isValidBattleyeUid(uid))
      throw new Error(`invalid battleye uid provided, got "${uid}"`)
    const { suffix, search } = this.getBattleyeUidInfo(uid)
    const entries = await this.getReverseEntries(suffix, search)
    return this.getIdFromEntries(uid, entries)
  }

  /**
   * tries to find the element in a list of entries matching the given uid
   * @param uid the uid to look for
   * @param entries the database entries to check agains
   */
  private getIdFromEntries(uid: string, entries: BEGuid.DBSearchResponse) {
    let id: bigint = 0n
    const found = entries.some(({ steamid }) => {
      id = this.config.internals.steamIdOffset + BigInt(steamid)
      return uid === BEGuid.toBattleyeUID(id)
    })
    if (found) return id
    return null
  }

  /**
   * gets database entries from the given search parameters
   * @param suffix the table suffix to lookup
   * @param search the search string to look for
   */
  private getReverseEntries(suffix: ValidSuffix, search: string): Promise<BEGuid.DBSearchResponse> {
    return this.pool.query(
      `SELECT steamid FROM ${getTableName(suffix)} WHERE guid = UNHEX(?)`, search
    )
  }

  /**
   * retrieves database search parameters from an uid string
   * @param uid the uid to get the search parameters from
   */
  private getBattleyeUidInfo(uid: string): BEGuid.BattleyeUidInfo {
    return {
      suffix: <ValidSuffix>uid[0],
      search: uid.substr(1, this.config.internals.hexChars)
    }
  }

  /* checks if the provided string is a valid battleyeuid */
  static isValidBattleyeUid(uid: string) {
    return (/^[a-f0-9]{32}$/).test(uid)
  }

  /**
   * generates the battleye uid from a steamid
   * @param id the steamid to generate
   */
  static toBattleyeUID(id: bigint) {
    const hex = Array(8).fill(null).reduce(curr => {
      curr.push(Number(id % 256n))
      return (id = id / 256n, curr)
    }, [0x42, 0x45])
    return createHash("md5").update(new Uint8Array(hex)).digest("hex")
  }

}

export namespace BEGuid {
  export interface Init {
    pool: Pool,
    cache: Cache,
    config: Configuration
  }

  export type DBSearchResponse = { steamid: number }[]

  export interface BattleyeUidInfo {
    suffix: ValidSuffix
    search: string
  }
}