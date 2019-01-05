const mysql = require("promise-mysql")
const config = require("./../config")

const pool = mysql.createPool(config.mysql.conn)

module.exports = pool

console.log(`Creating Database Table "${config.mysql.table}" if not exists...`)
if (!/^[a-z0-9\-_]+$/i.test(config.mysql.table)) throw new Error("MYSQL table name should only contain chars from a-z, 0-9, _ and -!")
pool
  .query(`CREATE TABLE IF NOT EXISTS ${config.mysql.table} (\`steamid\` INT UNSIGNED NOT NULL, \`guid\` BINARY(${Math.ceil(config.guid.length / 2)}) NOT NULL, INDEX (\`guid\`)) ENGINE = MYISAM`)
  .then(async () => {
    var res = (await pool.query(`SHOW table status WHERE Name = ?`, config.mysql.table))[0]
    if (!res) throw new Error(`Did not receive table status for table ${config.mysql.table}`)
    if (res.Engine.toLowerCase() !== "myisam") throw new Error(`DB Engine is not set to MyISAM! Engine is ${res.Engine}`)
    var description = await pool.query(`DESCRIBE ${config.mysql.table}`)
    description.forEach(row => {
      switch (row.Field) {
        case "steamid":
          if (row.Type !== "int(10) unsigned") throw new Error(`Type of steamid is not "int(10) unsigned", got ${row.Type}`)
          return
        case "guid":
          if (row.Type !== `binary(${Math.ceil(config.guid.length / 2)})`) throw new Error(`Type of guid is not "binary(${Math.ceil(config.guid.length / 2)})", got ${row.Type}`)
          return
        default:
          throw new Error(`Unexpected Field ${row.Field} found in Table!`)
      }
    })
    if (description.length !== 2) throw new Error(`Error with structure definition! expected 2 rows but got ${description.length}`)
    require("./generator").setStart(BigInt(res.Rows))
  })
  .catch(err => {
    throw err
    process.exit()
  })
