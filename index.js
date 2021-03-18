const express = require('express');
const mongoose = require('./DBconnection');
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
const amqp = require('amqplib');

//Uncomment for Service-Bus Utility
// const { ServiceBusClient } = require("@azure/service-bus");
// const serviceBusClient = new ServiceBusClient(process.env.fullyQualifiedNamespace, process.env.credential);
// const sender = serviceBusClient.createSender("my-queue");

//Middlewares
const app = express();
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
//rabbitMQ Initialize
// simulate request ids
let lastRequestId = 1;

// RabbitMQ connection string
const messageQueueConnectionString = process.env.CLOUDAMQP_URL;

app.post("/upload", upload.single('shapefile'), async (req, res, next) => {
      const GeoJSON = await shapefile.open("./uploads/" + req.file.filename)
        .then(source => source.read()
            .then(function log(result) {
                if (result.done) return;
                return result.value;
            }))
        .catch(error => console.error(error.stack));
        const geoJ = new Geo({
        shape: GeoJSON.geometry.type,
        Coordinates: GeoJSON.geometry.coordinates
    })
    try {
        //save in the Database
        await geoJ.save();

        // connect to Rabbit MQ and create a channel
        let connection = await amqp.connect(messageQueueConnectionString);
        let channel = await connection.createConfirmChannel();
        let requestId = lastRequestId;
        lastRequestId++;
        let message = " ";
        let requestData = geoJ.id;
        console.log("Published a request message, requestId:", requestId+"\n");
        await publishToChannel(channel, { routingKey: "request", exchangeName: "processing", data: { requestId, message, requestData } });
        res.redirect('/');
    }
    catch (err){
        console.log(err.message)
        res.redirect('/');
      }
    });

app.get('/download',async(req,res)=>{
  try {
    clients= await Geo.find();
    if(clients == "")
      console.log("There is no data in the Database\n")
    else
      console.log("Data Retrieved Succesfully\n");
    res.render('download',{clients});
  }catch(err){
    console.log(err)
  }
});

// utility function to publish messages to a channel
function publishToChannel(channel, { routingKey, exchangeName, data }) {
  return new Promise((resolve, reject) => {
    channel.publish(exchangeName, routingKey, Buffer.from(JSON.stringify(data), 'utf-8'), { persistent: true }, function (err, ok) {
      if (err) {
        return reject(err);
      }

      resolve();
    })
  });
}

async function listenForResults() {
  // connect to Rabbit MQ
  let connection = await amqp.connect(messageQueueConnectionString);

  // create a channel and prefetch 1 message at a time
  let channel = await connection.createChannel();
  await channel.prefetch(1);

  // start consuming messages
  await consume({ connection, channel });
}


// consume messages from RabbitMQ
function consume({ connection, channel, resultsChannel }) {
  return new Promise((resolve, reject) => {
    channel.consume("processing.results", async function (msg) {
      // parse message
      let msgBody = msg.content.toString();
      let data = JSON.parse(msgBody);
      let requestId = data.requestId;
      let processingResults = data.processingResults;
      let message = data.message;
      console.log("Received a result message, requestId:", requestId,"\nprocessingData with ID:", processingResults, "\nmessage:", message+"\n");

      // acknowledge message as received
      await channel.ack(msg);
    });

    // handle connection closed
    connection.on("close", (err) => {
      return reject(err);
    });

    // handle errors
    connection.on("error", (err) => {
      return reject(err);
    });
  });
}

//Listener
sslServer.listen(8765, () => console.log("Https is On\n"));
//app.listen(8765, () => console.log("Http is On"));

listenForResults();
