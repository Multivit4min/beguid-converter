import { beguid } from "./beguid"
import { pool } from "./mysql"
import { config } from "./config"
import { Generator } from "../lib/Generator"

export let generator: Generator

export async function initialize() {
  generator = new Generator({ beguid, config, pool })
  await generator.initialize()
  generator.generateAmount(1000000000n)
  generator.start()
}