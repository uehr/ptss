const wordLogicDistance = require("./wordLogicDistance")

module.exports = (keys1, keys2) => {
  let point = 0
  keys1.forEach(key1 => {
    keys2.forEach(key2 => {
      point += wordLogicDistance(key1, key2)
    })
  })
  return point
}