const config = require("../config")
const { Cache } = require("./lib/Cache")
const { server } = require("./ipc")

const cache = new Cache(Object.assign({}, config.cache, { saveFile: `${config.datadir}/cache.json` }))

server.on("CACHE#GETSTATUS", (_, socket) => {
  server.emit(socket, "CACHE#SENDSTATUS", cache.getStats(20))
})

module.exports = {
  find: guid => cache.findGuid(guid),
  add: (guid, steamid) => cache.addGuid(guid, steamid)
}
