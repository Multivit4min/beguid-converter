import { workerData } from "worker_threads"
import { initialize as initConfig, config } from "./setup/config"
import { createPool } from "./setup/mysql"
import { GeneratorWorker } from "./lib/GeneratorWorker"
import type { Generator } from "./lib/Generator"

const { lastInserted, generateUntil }: Generator.WorkerData = workerData


;(async () => {
  await initConfig()
  const pool = await createPool(config.mysql.connection)
  const generatorWorker = new GeneratorWorker({
    pool, lastInserted, generateUntil, config
  })
  await generatorWorker.run()
  process.exit(0)
})()
