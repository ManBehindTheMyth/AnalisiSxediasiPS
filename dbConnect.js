const mongoose = require('mongoose')
const uri = "mongodb+srv://admin:admin@cluster0.ordnd.mongodb.net/AnalisiSxediasiPS?retryWrites=true&w=majority";

mongoose.connect(uri, {
  dbName: 'AnalisiSxediasiPS',
  useNewUrlParser: true,
  useUnifiedTopology: true
}).catch((e)=>{
  console.log('Database connectivity error ',e)
})
console.log("db Connected")
module.exports = mongoose;
