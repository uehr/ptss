const node = require('./models/node');
const text = require('./models/text');
const loader = require('./models/sequelizeLoader');
const system = require("../system.json")
const socketIo = require("socket.io")
const wsConnect = require("socket.io-client").connect
const uploader = require("./lib/uploader")
const jsonDb = require("node-json-db")
const nodeData = new jsonDb(`./data/${system.nodeDataPath}`, true, true)
const textData = new jsonDb(`./data/${system.textDataPath}`, true, true)
const seachLink = socketIo.listen(system.seachLinkPort)
let seachLinkConnections = {}
let downloadConnections = {}
uploader.listen()

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
        seachLinkConnections[IP] = socket
      })
      socket.on("event", data => {
        console.log("event:")
        console.log(data)
      })
      socket.on("disconnect", () => {
        delete seachLinkConnections[IP]
      })
      resolve(socket)
    })
  },
  //not support multiple upload
  textDownload: (IP, textId) => {
    return new Promise((resolve, reject) => {
      try {
        //if is exists, not error
        textData.getData(`/${textId}`)
        // throw "is exists"
      } catch(err) {
        //is is not exists
        if(err.name != "DataError") {
          reject(err)
        }
      }
      const addr = `http://${IP}:${system.uploadPort}`
      const socket = wsConnect(addr)
      socket.on("connect", () => {
        downloadConnections[IP] = socket
        socket.emit("require", textId)
      })
      socket.on("upload", res => {
        textData.push(`/${res.id}`, res.text)
        resolve(res)
      })
      socket.on("failer", err => {
        console.log("failer:")
        console.log(err)
      })
      socket.on("disconnect", () => {
        delete downloadConnections[IP]
      })
    })
  },
  hoge: () => {
    // text.destroy(
    //   {where: {textId: "test"}}
    // )
    text.create({
      textId: "test",
      text: "test text"
    })
  }
}