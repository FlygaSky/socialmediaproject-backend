const multer = require("multer")
const path = require("path");

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/uploads")
    },
    filename: function (req, file, cb) {
      cb(
        null,
        path.parse(file.originalname).name +
          "-" +
          Date.now() +
          '.png'
      )
    },
  })
  
  const multerUpload = multer({ storage: storage })
  module.exports = multerUpload