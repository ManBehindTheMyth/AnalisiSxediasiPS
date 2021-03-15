const mongoose = require('mongoose');

const GeoJSON = new mongoose.Schema({
    shape: String,
    Coordinates: [[[Number]]]
});

module.exports = mongoose.model('GeoJSON', GeoJSON);