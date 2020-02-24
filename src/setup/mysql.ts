import mysql from "promise-mysql"
import { config } from "./config"

export type ValidSuffix = "0"|"1"|"2"|"3"|"4"|"5"|"6"|"7"|"8"|"9"|"a"|"b"|"c"|"d"|"e"|"f"
export let pool: mysql.Pool
let binaryLen: number

//initializes the mysql connection
export async function initialize() {
  if (!/^[a-z0-9\-_]+$/i.test(config.mysql.table))
    throw new Error("MYSQL table name should only contain chars from 'a-z', '0-9', '_' and '-'!")
  binaryLen = Math.ceil(config.converter.byteLength / 2)
  pool = mysql.createPool(config.mysql.connection)
  await createTables()
  await validateTables()
}

//creates all tables with their hex suffix
function createTables() {
  return Array(16).fill(null).map((_, i) => createTable(<ValidSuffix>i.toString(16)))
}

//creates a single table with its suffix
function createTable(suffix: ValidSuffix) {
  return pool.query(`CREATE TABLE IF NOT EXISTS ${getTableName(suffix)}\
    (\
      \`steamid\` INT UNSIGNED NOT NULL,\
      \`guid\` BINARY(${binaryLen}) NOT NULL,\
      INDEX (\`guid\`)\
    ) ENGINE = MYISAM`)
}

//validates all tables and checks if they have been correctly created
function validateTables() {
  return Array(16).fill(null).map((_, i) => validateTable(<ValidSuffix>i.toString(16)))
}

//validates a single tables and checks if they have been correctly created
async function validateTable(suffix: ValidSuffix) {
  const res = (await pool.query(`SHOW table status WHERE Name = ?`, getTableName(suffix)))[0]
  if (!res) throw new Error(`did not receive table status for table ${getTableName(suffix)}`)
  if (res.Engine.toLowerCase() !== "myisam") throw new Error(`DB Engine is not set to MyISAM! Engine is ${res.Engine}`)
  const desc = await pool.query(`DESCRIBE ${getTableName(suffix)}`)
  desc.forEach((row: Record<string, any>) => {
    switch (row.Field) {
      case "steamid":
        if (row.Type !== "int(10) unsigned") throw new Error(`Type of steamid is not "int(10) unsigned", got ${row.Type}`)
        return
      case "guid":
        if (row.Type !== `binary(${binaryLen})`) throw new Error(`Type of guid is not "binary(${binaryLen})", got ${row.Type}`)
        return
      default:
        throw new Error(`Unexpected Field ${row.Field} found in Table!`)
    }
  })
}

//returns a single table name with its suffix
export function getTableName(suffix: ValidSuffix) {
  if (!suffix.match(/^[a-f0-9]$/))
    throw new Error(`Invalid suffix provided "${suffix}"`)
  return `${config.mysql.table}${suffix}`
}
