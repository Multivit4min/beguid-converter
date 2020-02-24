"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_mysql_1 = __importDefault(require("promise-mysql"));
const config_1 = require("./config");
let binaryLen;
//initializes the mysql connection
async function initialize() {
    if (!/^[a-z0-9\-_]+$/i.test(config_1.config.mysql.table))
        throw new Error("MYSQL table name should only contain chars from 'a-z', '0-9', '_' and '-'!");
    binaryLen = Math.ceil(config_1.config.converter.byteLength / 2);
    exports.pool = promise_mysql_1.default.createPool(config_1.config.mysql.connection);
    await createTables();
    await validateTables();
}
exports.initialize = initialize;
//creates all tables with their hex suffix
function createTables() {
    return Array(16).fill(null).map((_, i) => createTable(i.toString(16)));
}
//creates a single table with its suffix
function createTable(suffix) {
    return exports.pool.query(`CREATE TABLE IF NOT EXISTS ${getTableName(suffix)}\
    (\
      \`steamid\` INT UNSIGNED NOT NULL,\
      \`guid\` BINARY(${binaryLen}) NOT NULL,\
      INDEX (\`guid\`)\
    ) ENGINE = MYISAM`);
}
//validates all tables and checks if they have been correctly created
function validateTables() {
    return Array(16).fill(null).map((_, i) => validateTable(i.toString(16)));
}
//validates a single tables and checks if they have been correctly created
async function validateTable(suffix) {
    const res = await getTableStatus(suffix);
    if (!res)
        throw new Error(`did not receive table status for table ${getTableName(suffix)}`);
    if (res.Engine.toLowerCase() !== "myisam")
        throw new Error(`DB Engine is not set to MyISAM! Engine is ${res.Engine}`);
    const desc = await getTableDescription(suffix);
    desc.forEach((row) => {
        switch (row.Field) {
            case "steamid":
                if (row.Type !== "int(10) unsigned")
                    throw new Error(`Type of steamid is not "int(10) unsigned", got ${row.Type}`);
                return;
            case "guid":
                if (row.Type !== `binary(${binaryLen})`)
                    throw new Error(`Type of guid is not "binary(${binaryLen})", got ${row.Type}`);
                return;
            default:
                throw new Error(`Unexpected Field ${row.Field} found in Table!`);
        }
    });
}
async function getTableStatus(suffix) {
    return (await exports.pool.query(`SHOW table status WHERE Name = ?`, getTableName(suffix)))[0];
}
exports.getTableStatus = getTableStatus;
function getTableDescription(suffix) {
    return exports.pool.query(`DESCRIBE ${getTableName(suffix)}`);
}
exports.getTableDescription = getTableDescription;
//returns a single table name with its suffix
function getTableName(suffix) {
    if (!suffix.match(/^[a-f0-9]$/))
        throw new Error(`Invalid suffix provided "${suffix}"`);
    return `${config_1.config.mysql.table}${suffix}`;
}
exports.getTableName = getTableName;
