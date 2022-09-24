var http = require("http");
var Busboy = require("busboy");
const csv = require("csv");
const streamifier = require("streamifier");
var fs = require("fs");

const options = { auto_parse: true, columns: true, relax_column_count: true };

module.exports.uploadCSV = function (req, res, next) {
  var busboy = Busboy({ headers: req.headers });
  let counter = 0;
  // Listen for event when Busboy finds a file to stream.
  busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
    // We are streaming! Handle chunks
    file.on("data", function (data) {
      // Here we can act on the data chunks streamed.

      counter++;
      if (counter === 1) {
        console.log(`File received chunk ${data.length}`);
        let myArr = [];
        streamifier
          .createReadStream(data)
          .pipe(
            csv.parse({
              columns: true,
              from: 2,
              ignoreEmpty: true,
              relax_column_count: true,
            })
          )
          .on("data", (row) => {
            myArr.push(row);
          })
          .on("end", function () {
            fs.writeFile("myjsonfile.json", JSON.stringify(myArr), (err) => {
              if (err) throw err;
              console.log("error at end", err);
            });
          });
      }
    });

    // Completed streaming the file.
    file.on("end", function (stream) {
      //Here I need to get the stream to send to SQS
    });
  });

  // Listen for event when Busboy finds a non-file field.
  busboy.on("field", function (fieldname, val) {
    // Do something with non-file field.
  });

  // Listen for event when Busboy is finished parsing the form.
  busboy.on("finish", function () {
    res.statusCode = 200;
    res.redirect("/upload");
  });

  // Pipe the HTTP Request into Busboy.
  req.pipe(busboy);
};
