import { promises as fs } from "fs"
import path from "path"
import yaml from "js-yaml"
import { ConnectionOptions } from "promise-mysql"

const internals = (config: Omit<Configuration, "internals">) => {
  const baseDir = path.join(__dirname, "../..")
  const dataDir = path.join(baseDir, config.data.dir)
  return {
    baseDir,
    dataDir,
    cacheFile: path.join(dataDir, "cache.json"),
    pidFile: path.join(dataDir, "pid"),
    hexChars: config.converter.byteLength * 2,
    steamIdOffset: BigInt(config.converter.offset)
  }
}
export let config: Configuration

export async function initialize() {
  const data = await fs.readFile(path.join(__dirname, "../..", "config.yaml"), "utf-8")
  const yamlConfig = yaml.safeLoad(data)
  config = { ...yamlConfig, internals: internals(yamlConfig) }
  if (config.webserver.credentials.admin === "CHANGE ME!!!")
    throw new Error("Configuration Error! Please change the admin password in your config.yml > webserver > credentials > admin !")
}

export interface Configuration {
  internals: ReturnType<typeof internals>
  webserver: {
    port: number
    headers: Record<string, string>
    postKeyLimit: number
    disableAdmin: boolean
    forceBasicAuthEverywhere: boolean
    credentials: Record<string, string>
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
    insertBatchSize: number
    byteLength: number
    offset: string
  }
}