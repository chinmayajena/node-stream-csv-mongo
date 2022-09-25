var http = require("http");
var Busboy = require("busboy");
const csv = require("csv");
const streamifier = require("streamifier");
var fs = require("fs");

const options = { auto_parse: true, columns: true, relax_column_count: true };

module.exports.uploadCSV = function (req, res, next) {
  var busboy = Busboy({ headers: req.headers });
  const writeStream = fs.createWriteStream("../../myfile.json", { flags: "a" });

  // Listen for event when Busboy finds a file to stream.
  busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
    // We are streaming! Handle chunks

    /*     file.on("data", function (data) {
      // Here we can act on the data chunks streamed.

      console.log(`File received chunk ${data.length}`);

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

        .pipe(writeStream);
    }); */

    file
      .pipe(csv.parse(options))
      .on("data", (row) => writeStream.write(JSON.stringify(row)))
      .on("error", (err) => console.log(err));

    // Completed streaming the file.
    file.on("end", function (stream) {
      //Here I need to get the stream to send to SQS
    });
  });

  // Listen for event when Busboy is finished parsing the form.
  busboy.on("finish", function () {
    res.statusCode = 200;
    res.redirect("/upload");
  });

  // Pipe the HTTP Request into Busboy.
  req.pipe(busboy);
};
