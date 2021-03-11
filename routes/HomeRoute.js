const router =  require('express').Router();
const homeController = require("../controllers/homeController");
const fileController = require("../controllers/fileController");

//const upload = require("../controllers/uploadController");

router.get("/", homeController.getHome);
router.post("/upload", fileController.upload);

module.exports = router;
//Helping
//
//module.exports = router;
