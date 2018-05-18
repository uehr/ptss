const socketIo = require("socket.io")
const system = require("../system.json")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const texts = low(new fileSync(`./data/${system.nodeDataPath}`))
const local = low(new fileSync(`./data/${system.localDataPath}`))
const keys = low(new fileSync(`./data/${system.keyDataPath}`))
const nodes = low(new fileSync(`./data/${system.nodeDataPath}`))
const recvNodeData = require("./recvNodeData")

/**
 * # peer
 * - share the key
 */

class peer {
  constructor() {
    this.sockets = {}
  }

  listen(port) {
    const peer = socketIo.listen(port)

    peer.sockets.on("request", () => {
      const localKeys = keys.getState()
      socket.emit("key", localKeys)
    })

    peer.sockets.on("key", peerKeys => {
      for (id in peerKeys) if (!keys.has(id).value()) {
        console.log(`update key: ${id}`)
        keys.set(id, peerKeys[id]).write()
      }
    })

    peer.sockets.on("connect", socket => {
      const IP = socket.request.connection.remoteAddress
      console.log("connecting peer " + IP)
      this.sockets[IP] = socket
      recvNodeData(socket, IP.replace("::ffff:", ""))
      socket.emit("nodeData", local.getState())
      setInterval(() => {
        socket.emit("request")
      }, system.shareKeyInterval * 1000)
    })
  }

  getSockets() {
    return this.sockets
  }
}

module.exports = peer