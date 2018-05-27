const shasum = require("crypto")

module.exports = {
  text: (writerIP, text) => {
    const crypto = shasum.createHash("sha1").update(`${writerIP}${text}`)
    return crypto.digest("hex")
  },

  key: (nodeIP, textId, limitDate) => {
    return shasum.createHash("sha1").update(`${nodeIP}${textId}${limitDate}`).digest("hex")
  }
}