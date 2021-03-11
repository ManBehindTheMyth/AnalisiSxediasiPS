//exports.home_get = (req, res) => {
    //res.send('We are on Home');
    //res.render("home", {})
//};

const path = require("path");

const home = (req, res) => {
  return res.render("home", {});
  //return res.sendFile(__dirname+'../static/views/home.ejs');

};

module.exports = {
  getHome: home
};
