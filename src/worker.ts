import { workerData } from "worker_threads"
import { initialize as initConfig, config } from "./setup/config"
import { createPool } from "./setup/mysql"
import { GeneratorWorker } from "./lib/GeneratorWorker"
import type { Generator } from "./lib/Generator"

const { lastInserted, generate }: Generator.WorkerData = workerData

;(async () => {
  try {
    await initConfig()
    const pool = await createPool(config.mysql.connection)
    const generatorWorker = new GeneratorWorker({
      pool,
      config,
      lastInserted,
      generateUntil: generate
    })
    await generatorWorker.run()
    console.log("generator task finnished successful")
    process.exit(0)
  } catch (e) {
    console.log("generator task errored")
    console.error(e)
    process.exit(2)
  }
})()
