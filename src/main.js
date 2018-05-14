const node = require("./node.js")
// node.connectSeachLink("127.0.0.1").then(socket => {})
// node.hoge()
node.textDownload("127.0.0.1", "test").then(res => {
  console.log("res:")
  console.log(res)
}).catch(err => {
  console.log(err)
})