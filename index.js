const express = require('express');
const mongoose = require('mongoose');
const bodyparser = require('body-parser');
const https = require('https');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const morgan = require('morgan');

require('dotenv').config();

//Connect to MongoDB.
mongoose.connect(process.env.DB_CONNECTION,
    {useNewUrlParser: true, useUnifiedTopology: true}, () =>
        console.log('Connected to DB')
);

//Middlewares
var app = express();

global.__basedir = __dirname;

var corsOptions = {
  origin: "http://localhost:8765"
};

app.use(cors(corsOptions));

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

//app.use('/', require('./routes/HomeRoute'));
const initRoutes = require("./routes/HomeRoute");

//app.use(express.urlencoded({ extended: true }));
app.use('/', require('./routes/HomeRoute'));
app.use('/upload', require('./routes/HomeRoute'))


//Listener
sslServer.listen(8765, ()=>console.log("Https is On"));
//app.listen(8765, () => console.log("Http is On"));
