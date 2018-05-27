const system = require("./system.json")
const socketIo = require("socket.io")
const readlineSync = require("readline-sync")
const readline = require("readline")
const wsConnect = require("socket.io-client").connect
const sleep = require("sleep-promise")
const low = require("lowdb")
const cluster = require("cluster")
const fileSync = require("lowdb/adapters/FileSync")
const child_process = require("child_process")
const randomPick = require("pick-random")
const localIP = require("my-local-ip")
const calculateId = require("./lib/calculateId")
const isOnlineNode = require("./lib/isOnlineNode")
const getOnlineNodes = require("./lib/getOnlineNodes")
const wordLogicDistance = require("./lib/wordLogicDistance")
const clusterLogicDistance = require("./lib/clusterLogicDistance")
const isIP = require("is-ip")
const moment = require("moment")
const fs = require("fs")
const Log = new require("log")
const log = new Log("debug", fs.createWriteStream("./log/node.log"))
const recvSeachLink = require("./lib/recvSeachLink")
const recvPeerRequest = require("./lib/recvPeerRequest")
const recvUploadRequest = require("./lib/recvUploadRequest")
const peerSocket = require("./lib/peerSocket")
const colors = require("colors")
const sep = new Array(system.logSepLength).join("-")
let CUIProcess = child_process.fork("./lib/CUI.js")
const authorDescription = "uehr(https://www.uehr.co)"
const systemDescription = "PTSS is simple text sharing system on pure p2p network"
const cmdHelps = {
  "help": "Show ptss help",
  "hello": "Greeting to ptss",
  "addnode (IP)": "Add other node",
  "clusterkey (key1) (key2) (key3)": "Register cluster key",
  "download (text id)": "Download text",
  "texts": "Local saved text list",
  "read (text id)": "Read locally saved text",
  "ip": "Show local IP",
  "peer": "Show connecting peers",
  "upload (text name) (text content)": "Text upload to ptss network",
  "seach (seach word)": "Seach text uploaded to the network"
}

console.ptssText = (textDetails) => {
  console.log(`[writer: ${textDetails.writerIP.green}]\n[title: ${textDetails.name.green}]\n${sep}\n${textDetails.content.bold}\n${sep}`)
}

class node {

  constructor() {
    this.recver = socketIo.listen(system.p2pPort)
    this.peers = {}
    this.clients = {}
    this.returnSeachResult = () => { } // seach result return func
    this.texts = low(new fileSync(`./data/${system.textDataPath}`))
    this.nodes = low(new fileSync(`./data/${system.nodeDataPath}`))
    this.local = low(new fileSync(`./data/${system.localDataPath}`))
    this.keys = low(new fileSync(`./data/${system.keyDataPath}`))
    this.texts.defaults({}).write()
    this.nodes.defaults({}).write()
    this.local.defaults({ IP: localIP(), clusterKeys: [] }).write()
    this.keys.defaults({}).write()
    this.isCUImode = false
    this.recver.sockets.on("connect", socket => {
      //communicate to other node
      const IP = socket.request.connection.remoteAddress.replace("::ffff:", "")
      recvUploadRequest(socket, this)
      recvPeerRequest(socket, this)
      recvSeachLink(socket, this)

      socket.on("error", error => {
        log.error(error)
      })
    })

    setInterval(() => {
      this.removeExpiredKeys()
    }, system.checkKeyLimitInterval)

    setInterval(() => {
      this.uploadKeyFromLocalTexts()
    }, system.updateKeyInterval)

    setInterval(() => {
      this.removeLimitOverNodes()
    }, system.checkNodeLimitInterval)

    // check the peer connect
    setInterval(() => {
      if (Object.keys(this.peers).length <= 0) {
        getOnlineNodes(this.getNodes(), this).then(onlineNodes => {
          delete onlineNodes[localIP()]
          if (Object.keys(onlineNodes).length > 0) {
            const peerIP = randomPick(Object.keys(onlineNodes))
            this.connectPeer(peerIP)
          }
        }).catch(err => {
          log.error(err)
        })
      }
    }, system.peerConnectCheckInterval)
  }

  async startCUI() {
    CUIProcess.send("end") // start CUI process command loop
    CUIProcess.on("message", recvCmd => {
      (async cmd => {
        switch (cmd.type) {
          case "hello": {
            console.log("Hello from ptss :)".bold)
            return
          } case "help": {
            console.log(`Author: ${authorDescription.yellow}\nOverview:\n  ${systemDescription.green}\nCommands:`)
            for (let cmdName in cmdHelps)
              console.log(`  ${cmdName.green}: ${cmdHelps[cmdName]}`)
            return
          } case "addnode": {
            const addIP = cmd.args[0]
            try {
              if (isIP(addIP)) {
                this.setNode(addIP, { clusterKeys: [] })
                console.log("added".green)
              } else {
                throw "ERROR: invalid IP"
              }
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "clusterkey": {
            try {
              this.setClusterKey(cmd.args)
              console.log("setted".green)
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "download": {
            const textId = cmd.args[0]
            await this.textDownload(textId).then(textDetails => {
              console.ptssText(textDetails)
            }).catch(err => {
              console.log(err.red)
            })
            return
          } case "read": {
            try {
              const id = cmd.args[0]
              if (this.texts.has(id).value()) {
                const textDetails = this.texts.get(id).value()
                console.ptssText(textDetails)
              } else throw `id:${id} is not exists`
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "ip": {
            try {
              console.log(localIP().green)
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "peer": {
            try {
              Object.keys(this.peers).forEach(peerIP => {
                console.log(`${sep}\n${peerIP.green}`)
              })
              console.log(sep)
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "texts": {
            try {
              const textsDetails = this.texts.getState()
              const textsLength = Object.keys(textsDetails).length
              for (let id in textsDetails) {
                console.log(sep)
                const details = textsDetails[id]
                console.log(`name: ${details.name.green}\nwriter: ${details.writerIP === localIP() ? "you".green : details.writerIP.green}\nid: ${id.green}`)
              }
              console.log(`${sep}\nmatch: ${textsLength.toString().green}`)
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "upload": {
            try {
              const textName = cmd.args[0]
              cmd.args.shift()
              const text = cmd.args.join(" ")
              const details = await this.textUpload(textName, text)
              console.log(`${sep}\nname: ${details.name.green}\ncontent: ${details.content.green}\nid: ${details.id.green}\n${sep}`)
            } catch (err) {
              console.log(err.red)
            }
            return
          }
          case "seach": {
            try {
              const seachWord = cmd.args[0]
              console.log("seaching...".green)
              const matchKeys = await this.seach(seachWord, system.seachPopLimit)
              const matchLength = Object.keys(matchKeys).length
              for (let id in matchKeys) {
                const key = matchKeys[id]
                const isDownloaded = this.texts.has(key.textId).value()
                console.log(`${sep}\nname: ${key.textName.green}\nwriter: ${key.writerIP === localIP() ? "you".green : key.writerIP.green}\nid: ${key.textId.green}\ndownloaded: ${(isDownloaded ? "yes" : "no").green}`)
              }
              console.log(`${sep}\nmatch: ${matchLength.toString().green}`)
            } catch (err) {
              console.log(err.red)
            }
            return
          } case "exit": {
            console.log("exit".green)
            process.exit(0)
            return
          } default: {
            console.log("unknown command".red)
            return
          }
        }
      })(recvCmd).catch(error => {
        console.log(`ERROR: ${error}`)
      }).finally(() => {
        CUIProcess.send("end")
      })
    })
  }

  setNode(IP, details) {
    if (IP != localIP()) {
      const formatedIP = IP.replace(/\./g, "-")
      this.nodes.set(formatedIP, details).write()
    }
  }

  removeNode(IP) {
    const formatedIP = IP.replace(/\./g, "-")
    this.nodes.unset(formatedIP).write()
  }

  getNodes() {
    let formatedNodes = {}
    const nodes = this.nodes.getState()
    for (let IP in nodes)
      formatedNodes[IP.replace(/-/g, ".")] = nodes[IP]
    return formatedNodes
  }

  registerPeer(IP, socket) {
    this.peers[IP] = socket
  }

  unregisterPeer(IP) {
    delete this.peers[IP]
  }

  connectPeer(peerIP) {
    return new Promise((resolve, reject) => {
      const socket = wsConnect(`ws://${peerIP}:${system.p2pPort}`)
      const IP = socket.io.opts.hostname

      try {
        this.clients[IP] = socket
        socket.emit("peer-connect")
        peerSocket(socket, this)
      } catch (err) {
        console.log(err)
        log.error(err)
        socket.disconnect()
        reject(err)
      }

      socket.on("connect", async () => {
        if (this.isCUImode) {
          CUIProcess = child_process.fork("./lib/CUI.js")
          this.startCUI()
        }
        resolve()
      })

      setTimeout(() => {
        reject("timeout")
      }, system.peerConnectTimeout)
    })
  }

  async textUpload(textName, text) {
    const writerIP = localIP()
    const id = calculateId.text(writerIP, text)
    if (!text) throw "empty text"
    else if (this.texts.has(id).value()) throw "is exists upload"
    else {
      const textDetails = {
        name: textName,
        writerIP: writerIP,
        content: text
      }
      this.texts.set(id, textDetails).write()
      const key = this.generateKey(textName, id, localIP())
      this.keys.set(key.keyId, key.details).write()
      return {
        id: id,
        name: textName,
        content: text
      }
    }
  }

  removeExpiredKeys() {
    const now = new Date().getTime()
    let localKeys = this.keys
    for (let id in localKeys.getState())
      if (localKeys.get(id).value().limitDate <= now)
        localKeys.unset(id)
    localKeys.write()
    return localKeys
  }

  removeLimitOverNodes() {
    const localNodes = this.getNodes()
    let nodeIPs = Object.keys(localNodes)
    const nodesLength = nodeIPs.length
    const overLength = system.nodesLimit - nodesLength
    const localClusterKeys = this.local.getState().clusterKeys
    if (overLength < 0) {
      nodeIPs.sort((a, b) => {
        const clusterKeysA = localNodes[a].clusterKeys
        const clusterKeysB = localNodes[b].clusterKeys
        const distanceA = clusterLogicDistance(clusterKeysA, localClusterKeys)
        const distanceB = clusterLogicDistance(clusterKeysB, localClusterKeys)
        if (distanceA < distanceB) return -1
        else if (distanceA > distanceB) return 1
        else return 0
      })
      for (let i = 0; i < Math.abs(overLength); i++) this.removeNode(nodeIPs[i])
    }
  }

  generateKey(textName, textId, writerIP) {
    // set the key limit
    const nodeIP = localIP()
    const now = new Date().getTime()
    const limitDate = now + system.keyLimit // int type
    const keyId = calculateId.key(nodeIP, textId, limitDate)
    return {
      keyId: keyId,
      details: {
        nodeIP: nodeIP,
        textName: textName,
        textId: textId,
        limitDate: limitDate,
        writerIP: writerIP
      }
    }
  }

  uploadKeyFromLocalTexts() {
    const localTexts = this.texts.getState()
    for (let id in localTexts) {
      const details = localTexts[id]
      const key = this.generateKey(details.name, id, details.writerIP)
      this.keys.set(key.keyId, key.details).write()
    }
  }

  getUploadableNodeIPs(textId) {
    return new Promise(async (resolve, reject) => {
      const checkedKeys = this.removeExpiredKeys()
      let uploadableNodeIPs = []
      for (let id in checkedKeys.getState()) {
        const key = checkedKeys.get(id).value()
        if (key.textId === textId) {
          const isOnline = await isOnlineNode(key.nodeIP, this)
          if (isOnline) uploadableNodeIPs.push(key.nodeIP)
        }
      }
      resolve(uploadableNodeIPs)
    })
  }

  //not support multiple upload
  textDownload(textId) {
    return new Promise(async (resolve, reject) => {
      if (this.texts.has(textId).value()) reject("is exists")
      else {
        let socket
        const uploadableNodeIPs = await this.getUploadableNodeIPs(textId)
        if (uploadableNodeIPs.length <= 0) {
          reject("not found uploadable nodes")
        } else {
          const IP = randomPick(uploadableNodeIPs)[0]
          const addr = `ws://${IP}:${system.p2pPort}`
          socket = wsConnect(addr)
          sleep(1000).then(() => {
            if (!socket.connected) reject("connect failer")

            socket.emit("upload-request", textId)
            socket.on("upload", res => {
              if (calculateId.text(res.writerIP, res.content) != textId) throw "invalid download data"
              else {
                log.info(`downloading ${res.id}`)
                this.texts.set(textId, res).write()
                resolve(res)
              }
            })

            socket.on("failer", error => {
              reject(error)
            })
          })
        }
      }
    })
  }

  setClusterKey(setKeys) {
    if (setKeys.length > system.clusterKeyLimit || setKeys.length <= 0) throw "cluster key limit"
    this.local.set("clusterKeys", setKeys).write()
  }

  async connectSeachLink(IP) {
    const addr = `ws://${IP}:${system.seachLinkPort}`
    const socket = wsConnect(addr)

    socket.on("connect", () => {
      socket.emit("nodeData", this.local.getState())
    })

    return socket
  }

  getSeachLinkableNodeIPs(exclusionNodes) {
    return new Promise((resolve, reject) => {
      let excludedPeers = Object.assign({}, this.peers) // copy the object
      let excludedNodes = Object.assign({}, this.getNodes())

      for (let IP in exclusionNodes) {
        delete excludedPeers[IP]
        delete excludedNodes[IP]
      }

      const peerIPs = Object.keys(excludedPeers)
      if (peerIPs.length > 0) {
        resolve(peerIPs)
      } else {
        getOnlineNodes(excludedNodes, this).then(onlineNodes => {
          resolve(Object.keys(onlineNodes))
        })
      }
    })
  }

  async getMatchKeys(seachWord) {
    const localKeys = this.removeExpiredKeys() // check expired keys
    let matchKeys = {}
    for (let id in localKeys.getState()) {
      const key = localKeys.get(id).value()
      if (key.textName.match(seachWord)) {
        matchKeys[id] = key
      }
    }
    return matchKeys
  }

  seach(seachWord, popCount) {
    return this.getSeachLinkableNodeIPs({ [localIP()]: {} }).then(seachLinkableNodeIPs => {
      return new Promise((resolve, reject) => {
        if (seachLinkableNodeIPs.length <= 0) reject("not found seach linkable node")
        else {
          const seachLinkIP = randomPick(seachLinkableNodeIPs)[0]
          this.returnSeachResult = resolve
          let localDetails = this.local.getState()
          delete localDetails["IP"]
          let localState = { [localIP()]: localDetails }
          let socket
          if (seachLinkIP in this.peers) {
            socket = this.peers[seachLinkIP]
          } else {
            socket = wsConnect(`ws://${seachLinkIP}:${system.p2pPort}`)
          }

          this.getMatchKeys(seachWord).then(matchKeys => {
            socket.emit("seach-request", seachWord, localIP(), matchKeys, localState, popCount)
          })

          setTimeout(() => {
            reject("seach timeout")
          }, 30000)

        }
      })
    })
  }

}

module.exports = node