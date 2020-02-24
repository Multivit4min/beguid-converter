import { initialize as initConfig } from "./setup/config"
import { initialize as initFileSystem } from "./setup/filesystem"
import { initialize as initMysql } from "./setup/mysql"

;(async() => {
  try {
    await initConfig()
    await initFileSystem()
    await initMysql()
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()