const sleep = require("sleep-promise")
const readline = require("readline-sync")
const system = require("../system.json")
let loadingMsg
// let peerConnected = false

console.overWrite = (text) => {
  process.stdout.clearLine()
  process.stdout.cursorTo(0)
  process.stdout.write(text)
}

process.on("message", async msg => {
  if (msg === "end") {
    const cmd = readline.question("ptss> ")
    if (cmd == system.exitCmd) process.exit(0)
    else {
      const splited_cmd = cmd.split(" ")
      const type = splited_cmd[0]
      splited_cmd.shift()
      const args = splited_cmd
      const sendMsg = { type: type, args: args }
      process.send(sendMsg)
    }
  }
})