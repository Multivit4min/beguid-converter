"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
class Generator {
    constructor(init) {
        this.worker = null;
        this.busy = false;
        this.lastInserted = -1n;
        this.generateUntil = -1n;
        this.pool = init.pool;
        this.beguid = init.beguid;
        this.config = init.config;
    }
    /** initializes the generator with data from the database */
    async initialize() {
        this.lastInserted = await this.fetchCurrentMaxId();
        if (this.lastInserted > this.generateUntil)
            this.generateUntil = this.lastInserted;
    }
    /** retrieves the current maximum used id */
    async fetchCurrentMaxId() {
        const status = await this.getOverallTableStatus();
        return status.reduce((acc, curr) => acc + BigInt(curr.Rows), 0n);
    }
    /** retrieves the mysql table status of all tables */
    getOverallTableStatus() {
        const tableName = this.config.mysql.table.replace(/_/g, "\\_");
        return this.pool.query(`SHOW table status WHERE Name LIKE '${tableName}_'`);
    }
    /** check if the genertor is currently working */
    isBusy() {
        return this.busy;
    }
    /** adds a new amount of data to generate */
    generateAmount(amount) {
        if (this.isBusy())
            throw new Error("there is already a job running, can not add more till the current job has finnished");
        if (amount < 0n)
            return this;
        this.generateUntil += amount;
        return this;
    }
    /** sends a stop request to the generator */
    stop() {
        this.busy = false;
        return this;
    }
    /** starts the generator */
    start() {
        if (this.lastInserted >= this.generateUntil)
            return this;
        this.busy = true;
        this.startWorker();
        return this;
    }
    startWorker() {
        this.worker = new worker_threads_1.Worker(path_1.default.join(__dirname, "../worker.js"));
        this.worker.on("exit", () => {
            this.busy = false;
            console.log("worker exited");
        });
    }
}
exports.Generator = Generator;
