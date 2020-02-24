"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const config_1 = require("./config");
async function initialize() {
    try {
        await fs_1.promises.mkdir(config_1.config.internals.dataDir);
    }
    catch (e) {
        if (e.code !== "EEXIST")
            throw e;
    }
    try {
        await fs_1.promises.stat(config_1.config.internals.cacheFile);
    }
    catch (e) {
        if (e.code === "ENOENT") {
            await fs_1.promises.writeFile(config_1.config.internals.cacheFile, JSON.stringify([]));
        }
        else {
            throw e;
        }
    }
    await fs_1.promises.writeFile(config_1.config.internals.pidFile, process.pid);
}
exports.initialize = initialize;
