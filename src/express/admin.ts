import { Router } from "express"
import path from "path"
import { config } from "../setup/config"
import { cache } from "../setup/cache"
import { generator } from "../setup/generator"

const admin = Router()

admin.get("/", (req, res) => {
  res.sendFile(path.join(config.internals.baseDir, "assets", "index.html"))
})

admin.post("/generate", (req, res) => {
  const { body } = req
  const till = (body && body.till) ? body.till : undefined
  if (till === undefined || isNaN(till)) return res.status(400).json({ error: "invalid body provided" })
  if (generator.isBusy()) return res.status(400).json({ error: "generator is busy" })
  try {
    generator.generateUntil(BigInt(till))
    generator.start()
  } catch (e) {
    return res.sendStatus(400)
  }
  res.sendStatus(200)
})

admin.get("/status", (req, res) => {
  res.json({
    config: {
      offset: config.converter.offset
    },
    generator: {
      busy: generator.isBusy(),
      status: generator.getWorkerStatus(),
      lastInsertedId: String(generator.lastInsertedId()),
      totalIds: String(generator.lastInsertedId() - BigInt(config.converter.offset))
    },
    cache: cache.getStats()
  })
})

export = admin