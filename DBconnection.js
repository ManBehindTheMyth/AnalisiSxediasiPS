const mongoose = require('mongoose');
require('dotenv').config();
const uri = process.env.DB_CONNECTION;

mongoose.connect(uri, {
  dbName: 'AnalisiSxediasiPS',
  useNewUrlParser: true,
  useUnifiedTopology: true
  })
  .then(console.log("DBconnected\n"))
  .catch((e)=>{
  console.log('Database connectivity error ',e)
  });

module.exports = mongoose
