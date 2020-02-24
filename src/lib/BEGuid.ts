import { createHash } from "crypto"

export class BEGuid {

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