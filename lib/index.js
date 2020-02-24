"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("./setup/config");
const filesystem_1 = require("./setup/filesystem");
const cache_1 = require("./setup/cache");
const mysql_1 = require("./setup/mysql");
const beguid_1 = require("./setup/beguid");
const generator_1 = require("./setup/generator");
(async () => {
    try {
        await config_1.initialize();
        await filesystem_1.initialize();
        await mysql_1.initialize();
    }
    catch (e) {
        console.error(e);
        process.exit(1);
    }
    await cache_1.initialize();
    await beguid_1.initialize();
    await generator_1.initialize();
})();
