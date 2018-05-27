const socketIo = require("socket.io")
const wsConnect = require("socket.io-client").connect
const system = require("../system.json")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const localIP = require("my-local-ip")
const isOnlineNode = require("./isOnlineNode")
const getOnlineNodes = require("./getOnlineNodes")
const fs = require("fs")
const Log = new require("log")
const log = new Log("debug", fs.createWriteStream("./log/node.log"))
const randomPick = require("pick-random")

module.exports = (socket, node) => {
  const IP = socket.request.connection.remoteAddress.replace("::ffff:", "")

  socket.on("seach-result", (seachWord, matchKeys, routeNodes) => {
    node.returnSeachResult(matchKeys)
    for (let keyId in matchKeys) {
      node.keys.set(keyId, matchKeys[keyId]).write()
    }
    let localNodes = node.nodes
    for (let IP in routeNodes) if(IP != localIP() && !localNodes.has(IP).value()) {
      localNodes.set(IP, routeNodes[IP])
    }
    localNodes.write()
  })

  socket.on("seach-request", async (seachWord, seachingNodeIP, matchKeys, routeNodes, popCount) => {
    const localMatchKeys = node.getMatchKeys(seachWord)
    Object.assign(matchKeys, localMatchKeys) // local match keys join to match keys

    let localState = node.local.getState()
    delete localState["IP"]
    routeNodes[localIP()] = localState
    const newPopCount = popCount - 1
    const seachLinkableNodeIPs = await node.getSeachLinkableNodeIPs(routeNodes)

    if (seachLinkableNodeIPs.length <= 0 || newPopCount <= 0) {
      const addr = `ws://${seachingNodeIP}:${system.p2pPort}`
      const returnSocket = wsConnect(addr)
      returnSocket.on("connect", () => {
        returnSocket.emit("seach-result", seachWord, matchKeys, routeNodes)
      })
    } else {
      const nextSeachLinkIP = randomPick(seachLinkableNodeIPs)[0]
      const seachLinkSocket = wsConnect(`ws://${nextSeachLinkIP}:${system.p2pPort}`)
      seachLinkSocket.emit("seach-request", seachWord, seachingNodeIP, matchKeys, routeNodes, newPopCount)
    }

    for (let id in matchKeys) node.keys.set(id, matchKeys[id])
  })

}