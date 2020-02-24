"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
const js_yaml_1 = __importDefault(require("js-yaml"));
const internals = (config) => ({
    dataDir: path_1.default.join(__dirname, "../..", config.data.dir),
    cacheFile: path_1.default.join(config.data.dir, "cache.json"),
    pidFile: path_1.default.join(config.data.dir, "pid"),
});
async function initialize() {
    const data = await fs_1.promises.readFile(path_1.default.join(__dirname, "../..", "config.yaml"), "utf-8");
    const yamlConfig = js_yaml_1.default.safeLoad(data);
    exports.config = { ...yamlConfig, internals: internals(yamlConfig) };
}
exports.initialize = initialize;
