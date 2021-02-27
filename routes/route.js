const router =  require('express').Router();

const starting_page = require("../controllers/home");

//Helping
router.get('/', starting_page.home_get);

module.exports = router;