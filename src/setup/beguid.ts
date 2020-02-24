import { BEGuid } from "../lib/BEGuid"
import { pool } from "./mysql"
import { cache } from "./cache"


export let beguid: BEGuid

export function initialize() {
  beguid = new BEGuid({ pool, cache })
}