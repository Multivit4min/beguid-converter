import { promises as fs } from "fs"
import path from "path"
import { basePath, config } from "./config"

let dataDir: string = ""

function getPath(file: string) {
  return path.join(dataDir, file)
}

export async function initialize() {
  dataDir = path.join(basePath, config.data.dir)
  try {
    await fs.mkdir(dataDir)
  } catch (e) {
    if (e.code !== "EEXIST") throw e
  }
  try {
    await fs.stat(getPath("cache.json"))
  } catch (e) {
    if (e.code === "ENOENT") {
      await fs.writeFile(getPath("cache.json"), JSON.stringify([]))
    } else {
      throw e
    }
  }
  await fs.writeFile(getPath("pid"), process.pid)
}