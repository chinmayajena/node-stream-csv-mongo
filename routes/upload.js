var express = require("express");
var router = express.Router();

const upload_controller = require("../controllers/upload");

/* GET users listing. */
router.get("/", function (req, res, next) {
  res.writeHead(200, { "Content-Type": "text/html" });
  res.write(
    '<form action="upload" method="post" enctype="multipart/form-data">'
  );
  res.write('<input type="file" name="fileToUpload" /> <br/>');
  res.write('<input type="submit"/>');
  res.write("</form>");
  return res.end();
});

router.post("/", upload_controller.uploadCSV);

module.exports = router;
