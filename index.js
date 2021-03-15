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

//Connect to MongoDB.
mongoose.connect(process.env.DB_CONNECTION,
    {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log('Connected to DB')
);

//Middlewares
const app = express();

app.set('view engine', 'ejs');
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}));
app.use(morgan('tiny'));

/*Set view engine as ejs to omit .ejs when rendering a view and Set static folder
--------------------------------------------------------------------------------------------
Documentation:
https://expressjs.com/en/guide/using-template-engines.html
https://expressjs.com/en/starter/static-files.html
*/
app.set('view engine', 'ejs');
app.use("/static", express.static("public"));


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

app.get('/', (req, res) => {
    res.render('home', {});
});

app.post("/upload", upload.single('shapefile'), async (req, res, next) => {
    console.log(req.file.filename)

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
    }
    catch (err){
        //Uncomment the following for Service-Bus Utility
        // const messages = {body: "Save Failed"}
        // await sender.sendMessages(messages);
        console.log(err.message)
    }
    res.render('home', {});
});


//Listener
sslServer.listen(8765, () => console.log("Https is On"));
//app.listen(8765, () => console.log("Http is On"));
