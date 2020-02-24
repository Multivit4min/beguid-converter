import { promises as fs } from "fs"
import path from "path"
import yaml from "js-yaml"
import { ConnectionOptions } from "promise-mysql"

export let config: Configuration
export const basePath = path.join(__dirname, "../..")

export async function initialize() {
  const data = await fs.readFile(path.join(basePath, "config.yaml"), "utf-8")
  config = yaml.safeLoad(data)
}

export interface Configuration {
  webserver: {
    port: number
    headers: Record<string, string>
    postKeyLimit: number
  }
  data: {
    dir: string
    cache: {
      keepTime: number
      saveInterval: number
    }
  }
  mysql: {
    connection: ConnectionOptions
    table: string
  }
  converter: {
    insertBatchSize: string
    byteLength: number
    offset: string
  }
}