const multer  = require('multer')
const router =  require('express').Router();
const homeController = require("../controllers/homeController");
//const fileController = require("../controllers/fileController");

router.get("/", homeController.getHome);
router.post("/upload", upload.single('shapefile'), function(req,res,next){
  console.log(req.file)
});

module.exports = router;
