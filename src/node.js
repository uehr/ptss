const node = require('./models/node');
const loader = require('./models/sequelizeLoader');
const system = require("../system.json")
const socketIo = require("socket.io")
const wsConnect = require("socket.io-client").connect
const seachLink = socketIo.listen(system.seachLinkPort)
const fileDownload = socketIo.listen(system.fileDownloadPort)
let connections = {}
node.sync()

seachLink.sockets.on("connection", socket => {
  console.log("connecting to ")
  console.log(socket.request.connection.remoteAddress)
})

module.exports = {
  updateList: (nodeId, IP, clusterKeys) => {
    return node.count().then(count => {
      if (system.nodeLimit < count) {
        throw "over the node limit"
      } else {
        return node.create({ nodeId: nodeId, IP: IP, clusterKeys: clusterKeys })
      }
    })
  },
  connectSeachLink: (IP) => {
    return new Promise((resolve, reject) => {
      const addr = `http://${IP}:${system.seachLinkPort}`
      const socket = wsConnect(addr)
      socket.on("connect", () => {
        connections[IP] = socket
      })
      socket.on("event", data => {
        console.log("event:")
        console.log(data)
      })
      socket.on("disconnect", () => {
        delete connections[IP]
      })
      resolve(socket)
    })
  },
  textUpload: (IP, textId, blockNum) => {
    return new Promise((resolve, reject) => {
      //TODO
    })
  },
  //support multiple upload
  textDownload: (IPs, textId) => {
    return new Promise((resolve, reject) => {
      //TODO
    })
  }
}