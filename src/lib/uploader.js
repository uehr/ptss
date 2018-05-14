const socketIo = require("socket.io")
const system = require("../../system.json")
const jsonDb = require("node-json-db")
const textData = new jsonDb(`../data/${system.textDataPath}`, true, true)
let sockets = {}

module.exports = {
  listen: () => {
    const uploader = socketIo.listen(system.uploadPort)

    uploader.sockets.on("connect", socket => {
      const IP = socket.request.connection.remoteAddress
      sockets[IP] = socket
      socket.on("require", textId => {
        try {
          console.log("request: " + textId)
          const text = textData.getData(`/${textId}`)
          socket.emit("upload", { id: textId, text: text.text })
        } catch (err) {
          socket.emit("failer", err)
        }
      })
    })

    uploader.sockets.on("disconnect", socket => {
      const IP = socket.request.connection.remoteAddress
      delete sockets[IP]
    })

  },
  getSockets: () => {
    return new Promise(resolve => {
      resolve(sockets)
    })
  }
}