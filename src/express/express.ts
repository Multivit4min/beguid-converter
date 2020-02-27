import express from "express"
import { config } from "../setup/config"
import { beguid } from "../setup/beguid"
import { json, urlencoded } from "body-parser"
import basicAuth from "express-basic-auth"

export function initialize() {
  return new Promise(fulfill => {
    const app = express()

    //accept json encoded and urlencoded bodies
    app.use(json())
    app.use(urlencoded({ extended: true }))

    //use admin interface?
    if (!config.webserver.disableAdmin) {
      app.use(
        "/admin",
        //basic authentication to protect the admin interface
        basicAuth({
          users: config.webserver.credentials,
          challenge: true
        }),
        require("./admin")
      )
    }

    //require basic auth for all routes?
    if (config.webserver.forceBasicAuthEverywhere) {
      app.use(basicAuth({ users: config.webserver.credentials }))
    }

    //append headers defined in the config
    app.use((req, res, next) => {
      const { headers } = config.webserver
      if (headers === null || headers === undefined) return next()
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
    app.get("/:steamid([0-9]{17})", async (req, res) => {
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
        ...(await beguid.convertBattleyeUIDs(body.filter(id => id.length === 32))),
        ...beguid.convertSteamIds(body.filter(id => id.length === 17))
      }})
    })

    //general 404 handling
    app.use((req, res) => res.status(404).json({ error: "No matching route found!" }))

    //start listening
    app.listen(config.webserver.port, () => {
      console.log(`express is listening on port ${config.webserver.port}`)
      fulfill()
    })
  })
}