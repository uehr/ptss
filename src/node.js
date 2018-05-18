const system = require("./system.json")
const socketIo = require("socket.io")
const wsConnect = require("socket.io-client").connect
const sleep = require("sleep-promise")
const uploader = new (require("./lib/uploader"))()
const seachLink = new (require("./lib/seachLink"))()
const peer = new (require("./lib/peer"))()
const recvNodeData = require("./lib/recvNodeData")
const uuid = require("uuid/v4")
const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const texts = low(new fileSync(`./data/${system.textDataPath}`))
const nodes = low(new fileSync(`./data/${system.nodeDataPath}`))
const local = low(new fileSync(`./data/${system.localDataPath}`))
const keys = low(new fileSync(`./data/${system.keyDataPath}`))

class node {

  constructor() {
    this.connectingPeer = null
    uploader.listen(system.uploadPort)
    seachLink.listen(system.seachLinkPort)
    peer.listen(system.peerPort)
  }

  async isOnlineNode(IP) {
    const socket = wsConnect(`ws://${IP}:${system.seachLinkPort}`)
    await sleep(1000)
    const isOnline = socket.connected
    socket.disconnect()
    return isOnline
  }

  async getOnlineNodes(checkNodes) {
    let onlineNodes = {}
    for (nodeId in checkNodes) {
      const nodeData = checkNodes[nodeId]
      const IP = nodeData.IP
      this.idOnlineNode(IP).then(isOnline => {
        if (isOnline) onlineNodes[nodeId] = nodeData
      })
    }
    return onlineNodes
  }

  setClusterKey(setKeys) {
    if (setKeys.length > system.clusterKeyLimit) throw "cluster key limit"
    myNode.set("clusterKeys", setKeys).write()
  }

  updateNodes(nodeId, IP, clusterKeys) {
    nodes.set(nodeId, { IP: IP, clusterKey: clusterKeys })
  }

  wordLogicDistance(word1, word2) {
    const minWord = (word1.length < word2.length ? word1 : word2)
    const maxWord = (word1.length > word2.length ? word1 : word2)
    return maxWord.match(minWord) ? minWord.length : 0
  }

  clusterLogicDistance(keys1, keys2) {
    let point = 0
    keys1.forEach(key1 => {
      keys2.forEach(key2 => {
        point += this.wordLogicDistance(key1, key2)
      })
    })
    return point
  }

  async connectSeachLink(IP) {
    const addr = `ws://${IP}:${system.seachLinkPort}`
    const socket = wsConnect(addr)
    recvNodeData(socket, IP)

    socket.on("connect", () => {
      seachLinkConnections[IP] = socket
      socket.emit("nodeData", local.getState())
    })

    socket.on("disconnect", () => {
      delete seachLinkConnections[IP]
    })

    return socket
  }

  //not support multiple upload
  textDownload(IP, textId) {
    return new Promise((resolve, reject) => {
      if (texts.has(textId).value()) reject("is exists")
      else {
        const addr = `ws://${IP}:${system.uploadPort}`
        const socket = wsConnect(addr)
        recvNodeData(socket, IP)

        socket.on("connect", () => {
          socket.emit("require", textId)
          socket.emit("nodeData", local.getState())
        })

        socket.on("upload", res => {
          console.log("down loading...")
          texts.set(res.id, {
            "text": res.text
          }).write()
          resolve(res.text)
        })

        socket.on("failer", err => {
          reject(err)
        })
      }
    })
  }

  async isExistsPeer(IP) {
    const connectingPeerIP = this.connectingPeer.io.opts.IP
    console.log(connectingPeerIP)
  }

  async connectPeer(IP) {
    if (await this.isOnlineNode(IP)) {
      console.log("peers:")

      // for(let existsConnectIp in peer.getSockets()){
      //   if(existsConnectIp.match(IP)){
      //     return "is exists connection"
      //   }
      // }

      const addr = `ws://${IP}:${system.peerPort}`
      const socket = wsConnect(addr)

      socket.on("request", () => {
        const localKeys = keys.getState()
        socket.emit("key", localKeys)
      })

      socket.on("key", peerKeys => {
        for (id in peerKeys) if (!keys.has(id).value()) {
          console.log(`update key: ${id}`)
          keys.set(id, peerKeys[id]).write()
        }
      })

      recvNodeData(socket, IP)

      socket.on("connect", () => {
        this.connectingPeer = socket
        socket.emit("nodeData", local.getState())
        // send keys request
        setInterval(() => {
          socket.emit("request")
        }, system.shareKeyInterval * 1000)
      })

      socket.on("disconnect", () => {
        this.connectingPeer = null
        throw "peer disconnect"
      })

      return socket
    } else {
      throw "is offline"
    }
  }

  async seach(word, popCount) {
    console.log(`seaching: ${word} ...`)
    for (nodeIP in nodes.getState()) {
      const addr = `ws://${nodeIP}:${system.seachLinkPort}`
      const socket = wsConnect(addr)
      socket.on("status", status => {
        if (status != "ok") socket.disconnect()
      })
      socket.on("connect", () => {
        socket.emit("nodeData", local.getState())
      })
    }
  }

}

module.exports = node