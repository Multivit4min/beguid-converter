import { promises as fs } from "fs"
import { config } from "./config"

export async function initialize() {
  try {
    await fs.mkdir(config.internals.dataDir)
  } catch (e) {
    if (e.code !== "EEXIST") throw e
  }
  try {
    await fs.stat(config.internals.cacheFile)
  } catch (e) {
    if (e.code === "ENOENT") {
      await fs.writeFile(config.internals.cacheFile, JSON.stringify([]))
    } else {
      throw e
    }
  }
  await fs.writeFile(config.internals.pidFile, process.pid)
}