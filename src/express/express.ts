import express from "express"
import { config } from "../setup/config"
import { beguid } from "../setup/beguid"
import { json, urlencoded } from "body-parser"

export async function initialize() {
  const app = express()
  app.listen(config.webserver.port, () => {
    console.log(`express is listening on port ${config.webserver.port}`)
  })

  app.use(json())
  app.use(urlencoded({ extended: true }))
  
  app.use((req, res, next) => {
    const { headers } = config.webserver
    Object
      .keys(headers)
      .forEach(key => res.append(key, headers[key]))
    next()
  })

  //single guid request
  app.get("/:guid([a-f0-9]{32})", async (req, res) => {
    try {
      res.json({
        data: await beguid.convertBattleyeUID(req.params.guid)
      })
    } catch (e) {
      res.status(404).json({ error: "No valid steamid found!" })
    }
  })

  //single steamid request
  app.get("/:steamid(0-9){17}", async (req, res) => {
    res.json({ data: beguid.convertSteamId(req.params.steamid) })
  })

  //multiple steamid / guid request
  app.post("/", async (req, res) => {
    const { body } = req
    if (!Array.isArray(body))
      return res.status(400).json({ error: "body needs to be an array "})
    if (body.length > config.webserver.postKeyLimit) 
      return res.status(400).json({ error: `body request limit exceeded (maximum ${config.webserver.postKeyLimit} keys)` })
    if (body.some(res => (typeof res !== "string" || !(/^([a-f0-9]{32}|\d{17})$/).test(res))))
      return res.status(400).json({ error: "a value in the body did not match the following pattern: ^([a-f0-9]{32}|\\d{17})$" })
    res.json({ data: {
      ...( await beguid.convertBattleyeUIDs(body.filter(key => key.length === 32))),
      ...beguid.convertSteamIds(body.filter(key => key.length === 17))
    }})
  })

  app.use((req, res) => res.status(400).json({ error: "No matching route found!" }))
}