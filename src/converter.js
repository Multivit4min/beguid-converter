const mysql = require("./mysql")
const config = require("../config")
const cache = require("./cache")
require("./lib/bigIntExtension")

class ConvertError extends Error {
  constructor() {
    super(...arguments)
  }
}

function toGuid(steamids) {
  var result = {}
  steamids.forEach(steamid => result[String(steamid)] = steamid.toBattleyeUID())
  return result
}

function toSteamId(guids) {
  return new Promise(async (fulfill) => {
    var result = {}
    var build = {}
    guids.forEach(id => {
      var res = cache.find(id)
      if (res !== false) return result[id] = res
      var short = id.substr(0, config.guid.length)
      if (!Array.isArray(build[short])) build[short] = []
      build[short].push(id)
    })
    if (Object.keys(build).length > 0) {
      (await mysql.query(
        `SELECT steamid FROM ${config.mysql.table} WHERE guid IN (${Array(Object.keys(build).length).fill("UNHEX(?)").join(",")})`,
        Object.keys(build)
      )).some(row => {
        if (Object.keys(build).length === 0) return true
        var steamid = config.steamid.offset + BigInt(row.steamid)
        var guid = steamid.toBattleyeUID()
        var short = guid.substr(0, config.guid.length)
        if (build[short] === undefined) return false
        var index = build[short].indexOf(guid)
        if (index === -1) return false
        result[guid] = steamid
        build[short].splice(index, 1)
        if (build[short].length === 0) delete build[short]
        return false
      })
      Object.values(build).forEach(arr => arr.forEach(guid => result[guid] = null))
    }
    fulfill(result)
    Object.keys(result).forEach(guid => cache.add(guid, result[guid]))
  })
}


module.exports = {
  toGuid,
  toSteamId
}
