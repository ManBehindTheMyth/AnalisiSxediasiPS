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
const app = express();

app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({extended: false}));
app.use(morgan('tiny'));

const sslServer = https.createServer({
        key: fs.readFileSync(path.join(__dirname, 'selfSignedCertificates', 'app.key')),
        cert: fs.readFileSync(path.join(__dirname, 'selfSignedCertificates', 'app.cert'))
    },
    app
)

app.use('/', require('./routes/route'));

//Listener
sslServer.listen(8765, ()=>console.log("Https is On"));
// app.listen(8765, () => console.log("Http is On"));