"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const beguid_1 = require("./beguid");
const mysql_1 = require("./mysql");
const config_1 = require("./config");
const Generator_1 = require("../lib/Generator");
async function initialize() {
    exports.generator = new Generator_1.Generator({ beguid: beguid_1.beguid, config: config_1.config, pool: mysql_1.pool });
    await exports.generator.initialize();
    exports.generator.generateAmount(1000n);
    exports.generator.start();
}
exports.initialize = initialize;
