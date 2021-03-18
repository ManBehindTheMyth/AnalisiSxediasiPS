const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const https = require('https');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');
const Geo = require("./models/GeoJSON");
require('dotenv').config();
const shapefile = require('shapefile');

//Uncomment for Service-Bus Utility
// const { ServiceBusClient } = require("@azure/service-bus");
// const serviceBusClient = new ServiceBusClient(process.env.fullyQualifiedNamespace, process.env.credential);
// const sender = serviceBusClient.createSender("my-queue");

//Middlewares
const app = express();

//Connect to Database
const uri = "mongodb+srv://admin:admin@cluster0.ordnd.mongodb.net/AnalisiSxediasiPS?retryWrites=true&w=majority";

mongoose.connect(uri, {
  dbName: 'AnalisiSxediasiPS',
  useNewUrlParser: true,
  useUnifiedTopology: true
  })
  .then(console.log("DBconnected"))
  .catch((e)=>{
  console.log('Database connectivity error ',e)
  });

  /*Set view engine as ejs to omit .ejs when rendering a view and Set static folder
  --------------------------------------------------------------------------------------------
  Documentation:
  https://expressjs.com/en/guide/using-template-engines.html
  https://expressjs.com/en/starter/static-files.html
  */

app.set('view engine', 'ejs');
app.use("/static", express.static("public"));
app.use(cors());
//app.use(morgan('tiny'));
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}));

const sslServer = https.createServer({
        key: fs.readFileSync(path.join(__dirname, 'selfSignedCertificates', 'app.key')),
        cert: fs.readFileSync(path.join(__dirname, 'selfSignedCertificates', 'app.cert'))
    },
    app
)

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads')
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
})
const upload = multer({storage});

var clients = "";

app.get('/', (req, res) => {
    clients = "";
    res.render('home');
});
app.get('/GTD', (req, res) => {
    res.render('download',{clients});
});
app.post("/upload", upload.single('shapefile'), async (req, res, next) => {
    const GeoJSON = await shapefile.open("./uploads/" + req.file.filename)
        .then(source => source.read()
            .then(function log(result) {
                if (result.done) return;
                return result.value;
            }))
        .catch(error => console.error(error.stack));
    let geoJ = new Geo({
        shape: GeoJSON.geometry.type,
        Coordinates: GeoJSON.geometry.coordinates
    })
    try {
        await geoJ.save();
        console.log("Your file "+req.file.filename+" uploaded succesfully!")
    }
    catch (err){
        //Uncomment the following for Service-Bus Utility
        // const messages = {body: "Save Failed"}
        // await sender.sendMessages(messages);
        console.log(err.message)
    }
    res.redirect('/');
});

app.get('/download',async(req,res)=>{
  try {
    clients= await Geo.find();
    if(clients == "")
      console.log("There is no data in the Databse")
    else
      console.log("Data Retrieved Succesfully");
    res.render('download',{clients});
  }catch(err){
    console.log(err)
  }
});

//Listener
sslServer.listen(8765, () => console.log("Https is On"));
//app.listen(8765, () => console.log("Http is On"));
