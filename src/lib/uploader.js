const socketIo = require("socket.io")
const system = require("../system.json")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const texts = low(new fileSync(`./data/${system.textDataPath}`))
const local = low(new fileSync(`./data/${system.localDataPath}`))
const recvNodeData = require("./recvNodeData")

class uploader {
  constructor() {
    this.sockets = {}
  }

  listen(port) {
    const uploader = socketIo.listen(port)

    uploader.sockets.on("connect", socket => {
      const IP = socket.request.connection.remoteAddress.replace("::ffff:", "")
      console.log(`connecting to ${IP}`)
      this.sockets[IP] = socket
      recvNodeData(socket, IP)
      socket.emit("nodeData", local.getState())

      socket.on("require", textId => {
        try {
          console.log("request: " + textId)
          const text = texts.get(textId).value()
          if(!text) throw "is not exists"
          console.log("uploading...")
          socket.emit("upload", { id: textId, text: text.text })
        } catch (err) {
          socket.emit("failer", err)
        }
      })

      socket.on("disconnect", () => {
        delete this.sockets[IP]
      })
    })

  }
  getSockets() {
    return this.sockets
  }
}

module.exports = uploader