const low = require("lowdb")
const fileSync = require("lowdb/adapters/FileSync")
const nodes = low(new fileSync(`./data/node.json`))

module.exports = (socket, IP) => {
  socket.on("nodeData", nodeData => {
    console.log(`update node data`)
    const existsData = nodes.get("nodes").find({IP: IP})
    //if is exists
    if(existsData.value()){
      //updating propertys
      existsData.assign({
        clusterKeys: nodeData.clusterKeys
      }).write()
    } else {
      nodes.get("nodes").push({
        IP: IP,
        clusterKeys: nodeData.clusterKeys
      }).write()
    }
  })
}