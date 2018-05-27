const socketIo = require("socket.io")
const system = require("../system.json")
const low = require("lowdb")
const peerSocket = require("./peerSocket")
const fileSync = require("lowdb/adapters/FileSync")
const fs = require("fs")
const Log = new require("log")
const log = new Log("debug", fs.createWriteStream("./log/node.log"))

module.exports = (socket, node) => {
  const IP = socket.request.connection.remoteAddress.replace("::ffff:", "")

  socket.on("peer-connect", () => {
    try {
      peerSocket(socket, node)
      log.info(`peer connected ${IP}`)
    } catch (err) {
      console.log("error: ")
      console.log(err)
      log.err(err)
      socket.disconnect()
    }
  })
}