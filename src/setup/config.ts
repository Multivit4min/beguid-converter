import { promises as fs } from "fs"
import path from "path"
import yaml from "js-yaml"
import { ConnectionOptions } from "promise-mysql"

const internals = (config: Omit<Configuration, "internals">) => ({
  dataDir: path.join(__dirname, "../..", config.data.dir),
  cacheFile: path.join(config.data.dir, "cache.json"),
  pidFile: path.join(config.data.dir, "pid"),
})
export let config: Configuration

export async function initialize() {
  const data = await fs.readFile(path.join(__dirname, "../..", "config.yaml"), "utf-8")
  const yamlConfig = yaml.safeLoad(data)
  config = { ...yamlConfig, internals: internals(yamlConfig) }
}

export interface Configuration {
  internals: ReturnType<typeof internals>
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