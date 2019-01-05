const fs = require("fs")
const config = require("./../config")

if (!fs.existsSync(config.datadir)) {
  console.log("Initializing...")
  fs.mkdirSync(config.datadir)
  fs.writeFileSync(`${config.datadir}/cache.json`, JSON.stringify([]))
}
fs.writeFileSync(`${config.datadir}/run.pid`, process.pid)

process.on("exit", () => fs.unlinkSync(`${config.datadir}/run.pid`))
process.on("SIGINT", () => process.exit())

require("./webserver")
require("./generator")
