const socketIo = require("socket.io")
const system = require("../system.json")
const fs = require("fs")
const Log = new require("log")
const log = new Log("debug", fs.createWriteStream("./log/node.log"))

module.exports = (socket, node) => {
  const IP = socket.request.connection.remoteAddress.replace("::ffff:", "")

  socket.on("upload-request", textId => {
    try {
      const text = node.texts.getState()[textId]
      if (!text) throw "is not exists"
      else {
        log.info(`upload text ${textId}`)
        socket.emit("upload", text)
      }
    } catch (err) {
      socket.emit("failer", err)
    } finally {
      if(!(IP in node.peers)) socket.disconnect()
    }
  })

}