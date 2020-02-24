import { Cache } from "../lib/Cache"
import { config } from "./config"

export let cache: Cache

export async function initialize() {
  cache = new Cache(config)
  await cache.initialize()
}