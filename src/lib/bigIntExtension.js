const { createHash } = require("crypto")

BigInt.prototype.toBattleyeUID = function toBattleyeUID() {
  var big = this
  var hex = Array(8).fill().reduce((curr, acc) => {
    curr.push(Number(big % 256n))
    return (big = big/256n, curr)
  }, [0x42, 0x45])
  return createHash("md5").update(new Uint8Array(hex)).digest("hex")
}
