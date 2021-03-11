const util = require("util");
const multer = require("multer");
//const maxSize = 2 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads');
  },
  filename: (req, file, cb) => {
    console.log(file.originalname);
    const { originalname } = file;
    cb(null, originalname);
  },
});

const uploadFile = multer({
  storage: storage
  //limits: { fileSize: maxSize },
}).single("shapefile");

//let uploadFileMiddleware = util.promisify(uploadFile);
//module.exports = uploadFileMiddleware;
module.exports = uploadFile;
