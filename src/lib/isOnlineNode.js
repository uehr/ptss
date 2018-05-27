const wsConnect = require("socket.io-client").connect
const sleep = require("sleep-promise")
const system = require("../system.json")

module.exports = (IP, node) => {
  return new Promise(resolve => {
    const addr = `ws://${IP}:${system.p2pPort}`
    const socket = wsConnect(addr)
    const formatedIP = socket.io.opts.hostname
    if (formatedIP in node.peers || socket.connected) {
      resolve(true)
    } else {
      sleep(500).then(() => {
        const isOnline = socket.connected
        socket.disconnect()
        resolve(isOnline)
      })
    }
  })
}