"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const crypto_1 = require("crypto");
class BEGuid {
    constructor(init) {
        this.pool = init.pool;
        this.cache = init.cache;
    }
    /**
     * generates the battleye uid from a steamid
     * @param id the steamid to generate
     */
    static toBattleyeUID(id) {
        const hex = Array(8).fill(null).reduce(curr => {
            curr.push(Number(id % 256n));
            return (id = id / 256n, curr);
        }, [0x42, 0x45]);
        return crypto_1.createHash("md5").update(new Uint8Array(hex)).digest("hex");
    }
}
exports.BEGuid = BEGuid;
