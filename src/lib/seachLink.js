const socketIo = require("socket.io")
const system = require("../system.json")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const texts = low(new fileSync(`./data/${system.textDataPath}`))
const recvNodeData = require("./recvNodeData")

class seachLink {
  constructor() {
    this.sockets = {}
  }

  listen(port) {
    const seachLink = socketIo.listen(port)
    seachLink.sockets.on("connect", socket => {
      const IP = socket.request.connection.remoteAddress
      this.sockets[IP] = socket
      console.log(`connecting seach link to ${IP}`)
      socket.emit("status", this.getStatus())
      socket.on("disconnect", () => {
        console.log("disconnect")
        delete this.sockets[IP]
      })
    })
  }

  getSockets() {
    return this.sockets
  }

  getStatus() {
    const length = Object.keys(this.sockets).length
    if (length > 5) {
      return "connection limit"
    } else if (length <= 5) {
      return "ok"
    }
  }
}

module.exports = seachLink