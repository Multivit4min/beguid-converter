const fs = require("fs")
const { datadir } = require("./config")
const ipc = require("node-ipc")
const inquirer = require("inquirer")
const colors = require("colors")

try {
  var master = `${fs.readFileSync(`${datadir}/run.pid`, "utf8")}.ipc`
} catch(e) {
  if (e.code !== "ENOENT") throw e
  console.log(`File "${datadir}/run.pid" not found! Is the master process running?`)
  process.exit()
}

ipc.config.id = master
ipc.config.retry = 1500
ipc.config.silent = true
ipc.connectTo(master)

function formatNumber(num) {
  num = Number(num)
  if (num > 1000000000) return `${(num/1000000000).toFixed(2)}B`
  if (num > 1000000) return `${(num/1000000).toFixed(2)}M`
  if (num > 1000) return `${(num/1000).toFixed(1)}k`
  return String(num)
}

const ACTIONS = {
  MENU: [{
    type: "list",
    name: "option",
    message: "What do you want to do?",
    choices: [
      "1) generate more steamids",
      "2) view generator status",
      "3) cache info"
    ]
  }],
  GENERATOR_SELECT_AMOUNT: {
    type: "input",
    name: "amount",
    message: "How many ids should be added?",
    validate(value) {
      if (isNaN(value)) return "Please provide a numeric value"
      if (Number(value) <= 0) return "Please provide a positive number"
      return true
    }
  }
}

console.log("Trying to connect to master process...")
var connectTimeout = setTimeout(() => {
  console.log("TIMEOUT WHILE TRYING TO REACH MASTER PROCESS!")
  process.exit()
}, 5000)

ipc.of[master].emit("IPC#PING")
ipc.of[master].once("IPC#PONG", () => {
  clearTimeout(connectTimeout)
  console.clear()
  inquirer
    .prompt(ACTIONS.MENU)
    .then(async select => {
      switch (select.option[0]) {
        case "1":
          var { amount } = await inquirer.prompt(ACTIONS.GENERATOR_SELECT_AMOUNT)
          ipc.of[master].emit("GENERATOR#RUN", amount)
          console.log(`Added ${String(amount).red} ids to generator queue`)
        case "2":
          ipc.of[master].on("GENERATOR#STATUS", state => {
            console.clear()
            console.log(`${formatNumber(state.currsteamid).green} inserted`)
            console.log(`${formatNumber(state.remaining).green} remaining ids left to insert`)
            console.log()
            console.log(`Timings per ${formatNumber(state.batchsize).green} inserts`.bold)
            console.log(`  Database ${String(state.time_mysql).green} ms`)
            console.log(`  Calculate ${String(state.time_calculating).green} ms`)
            console.log()
            console.log(`${"CTRL+C".bold} to exit`)
          })
          return
        case "3":
          ipc.of[master].emit("CACHE#GETSTATUS")
          ipc.of[master].once("CACHE#SENDSTATUS", res => {
            console.clear()
            console.log(`Total entries in cache: ${String(res.totalEntries).green}`)
            if (res.totalEntries === 0) return
            console.log(`Top Requested:`.bold)
            res.topRequested
              .forEach(top => console.log(`  ${top[0].red} -> ${String(top[3]).green} times`))
            console.log()
            console.log(`${"CTRL+C".bold} to exit`)
          })
          return
        default:
          console.log("NOT IMPLEMENTED")
          process.exit()
      }
    })
})
