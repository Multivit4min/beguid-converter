import { BEGuid } from "../lib/BEGuid"
import { pool } from "./mysql"
import { cache } from "./cache"
import { config } from "./config"


export let beguid: BEGuid

export async function initialize() {
  beguid = new BEGuid({ pool, cache, config })
}