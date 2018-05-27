const isOnlineNode = require("./isOnlineNode")

module.exports = async (checkNodes, node) => {
  let onlineNodes = {}
  for (let IP in checkNodes)
    if (await isOnlineNode(IP, node)) onlineNodes[IP] = checkNodes[IP]
  return onlineNodes
}