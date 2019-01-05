const pool = require("./mysql")
const config = require("./../config")
const Generator = require("./lib/Generator")
const { server, broadcast, sockets } = require("./ipc")

var status = {
  currsteamid: "0",
  remaining: "0",
  calculating: false,
  batchsize: String(config.generator.batchsize),
  time_mysql: 0,
  time_calculating: 0
}

const generator = new Generator()
generator
  .setOffset(config.steamid.offset)
  .setTableName(config.mysql.table)
  .setBatchSize(config.generator.batchsize)
  .setGuidLength(config.guid.length)
  .setPool(pool)

generator.on("batch", data => {
  status = Object.assign({}, status, {
    remaining: String(data.remaining),
    currsteamid: String(data.lastinserted),
    calculating: true,
    time_mysql: data.timer.mysql,
    time_calculating: data.timer.calculating
  })
})

server.on("GENERATOR#RUN", amount => {
  generator.add(BigInt(amount))
  if (generator.isBusy()) return
  generator.run()
    .then(() => status.calculating = false)
})

setInterval(() => {
  if (server.sockets.length === 0) return
  broadcast("GENERATOR#STATUS", status)
}, 1500)

module.exports = {
  setStart: start => {
    status.currsteamid = String(start)
    generator.setStart(start)
  }
}
