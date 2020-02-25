import { initialize as initConfig, config } from "./setup/config"
import { initialize as initFileSystem } from "./setup/filesystem"
import { initialize as initCache } from "./setup/cache"
import { initialize as initMysql } from "./setup/mysql"
import { initialize as initBEGuid } from "./setup/beguid"
import { initialize as initGenerator } from "./setup/generator"

;(async() => {
  try {
    await initConfig()
    await initFileSystem()
    await initMysql()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
  await initCache()
  await initBEGuid()
  await initGenerator()
})()