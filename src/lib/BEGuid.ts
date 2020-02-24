import { createHash } from "crypto"
import { Pool } from "promise-mysql"
import { Cache } from "../lib/Cache"

export class BEGuid {

  private pool: Pool
  private cache: Cache

  constructor(init: BEGuid.Init) {
    this.pool = init.pool
    this.cache = init.cache
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
    cache: Cache
  }
}