"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const BEGuid_1 = require("../lib/BEGuid");
const mysql_1 = require("./mysql");
const cache_1 = require("./cache");
function initialize() {
    exports.beguid = new BEGuid_1.BEGuid({ pool: mysql_1.pool, cache: cache_1.cache });
}
exports.initialize = initialize;
