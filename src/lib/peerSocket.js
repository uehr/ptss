const socketIo = require("socket.io")
const system = require("../system.json")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const localIP = require("my-local-ip")
const fs = require("fs")
const Log = new require("log")
const log = new Log("debug", fs.createWriteStream("./log/node.log"))

module.exports = (socket, node) => {
  let IP
  try {
    // if connect recv
    IP = socket.request.connection.remoteAddress.replace("::ffff:", "")
  } catch (err) {
    // if connect client
    IP = socket.io.opts.hostname
  } finally {
    node.registerPeer(IP, socket)
  }

  socket.on("key", peerKeys => {
    let localKeys = node.keys.getState()
    for (let id in peerKeys)
      node.keys.set(id, peerKeys[id]).write()
  })

  socket.on("node", peerNodes => {
    for (let setIP in peerNodes) if(setIP != localIP())
      node.setNode(setIP, peerNodes[setIP])
  })

  socket.on("peer-node", peerNodeDetails => {
    node.setNode(IP, peerNodeDetails)
  })

  const requestProcess = setInterval(() => {
    const localKeys = node.keys.getState()
    const localNodes = node.getNodes()
    const localDetails = node.local.getState()
    delete localDetails["IP"]
    socket.emit("key", localKeys)
    socket.emit("node", localNodes)
    socket.emit("peer-node", localDetails)
  }, system.shareDataInterval)

  socket.on("disconnect", () => {
    clearInterval(requestProcess)
    node.unregisterPeer(IP)
  })
}