const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const { listenport, post_key_limit, headers } = require(`${__dirname}/../config`)
const convert = require("./converter")

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use((req, res, next) => {
  Object.keys(headers).forEach(key => res.append(key, headers[key]))
  next()
})

//be guid to steamid
app.get("/:guid([a-f0-9]{32})", async (req, res) => {
  var data = await convert.toSteamId([req.params.guid])
  var steamid = String(Object.values(data)[0])
  if (steamid === null) return res.status(404).json({ error: "No valid steamid found!" })
  res.json({ data: steamid })
})

//steamid to be guid
app.get("/:steamid(\\d{17})", ({ params }, res) => {
  try {
    res.json({ data: convert.toGuid([BigInt(params.steamid)])[params.steamid] })
  } catch(e) {
    res.sendStatus(500)
    console.error(e)
  }
})

//multiple steamids or beguids
app.post("/", ({ body }, res, next) => {
  if (!Array.isArray(body))
    return res.status(400).json({ error: "Body needs to be an array" })
  if (body.length > post_key_limit)
    return res.status(400).json({ error: `Body exceeds the limit of ${post_key_limit} entries` })
  if (body.some(res => (typeof res !== "string" || !/^([a-f0-9]{32}|\d{17})$/.test(res))))
    return res.status(400).json({ error: "A value in the body did not match the following pattern: ^([a-f0-9]{32}|\\d{17})$" })
  next()
}, async ({ body }, res) => {
  var data = {}
  var guids = []
  var steamids = []
  body.forEach(key => {
    if (key.length === 32) return guids.push(key)
    return steamids.push(BigInt(key))
  })
  if (guids.length > 0) data = await convert.toSteamId(guids)
  if (steamids.length > 0) data = { ...data, ...convert.toGuid(steamids) }
  Object.keys(data).forEach(k => {
    if (typeof data[k] === "bigint") data[k] = String(data[k])
  })
  res.json({ data })
})

app.use((req, res) => res.status(400).json({ error: "No matching route found!" }))
app.listen(listenport, () => console.log(`Webserver running on Port ${listenport}`))
