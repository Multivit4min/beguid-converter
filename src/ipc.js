const ipc = require("node-ipc")

ipc.config.id = `${process.pid}.ipc`
ipc.config.retry = 1500
ipc.config.silent = true

ipc.serve()
ipc.server.start()

ipc.server.on("IPC#PING", (_, socket) => {
  ipc.server.emit(socket, "IPC#PONG")
})

module.exports = {
  server: ipc.server,
  broadcast: (...args) => ipc.server.broadcast(...args),
}
