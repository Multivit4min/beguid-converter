"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Cache_1 = require("../lib/Cache");
const config_1 = require("./config");
async function initialize() {
    exports.cache = new Cache_1.Cache(config_1.config);
    await exports.cache.initialize();
}
exports.initialize = initialize;
