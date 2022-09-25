var cuid = require("cuid");
var Busboy = require("busboy");
const csv = require("csv");
var fs = require("fs");

const options = { auto_parse: true, columns: true, relax_column_count: true };

module.exports.uploadCSV = function (req, res, next) {
  let busboy = Busboy({ headers: req.headers });
  const parser = csv.parse(options);
  //const writeStream = fs.createWriteStream("../../myfile.json", { flags: "a" });
  const db = req.app.locals.db;
  let dbase = db.db("yobulk");
  let d = new Date();
  let collectionName = d.toLocaleTimeString();
  dbase.createCollection(collectionName, function (err, res) {
    if (err) throw err;
  });

  let batch = [];

  // Listen for event when Busboy finds a file to stream.
  busboy.on("file", function (fieldname, file, filename, encoding, mimetype) {
    // We are streaming! Handle chunks
    let counter = 0;
    file
      .pipe(parser)
      .on("data", (row) => {
        if (batch.length === 50) {
          parser.pause();
          ++counter;
          dbase
            .collection(collectionName)
            .insertMany(batch)
            .then((data) => {
              console.log("done pushing batch", counter);
              batch.splice(0, batch.length);
              console.log(batch.length);
              parser.resume();
            });
        } else {
          //row = { ...row, _id: cuid() };
          batch.push(row);
        }
      })

      .on("end", function () {
        //  writeStream.write("]");
        if (batch.length > 0) {
          dbase
            .collection(collectionName)
            .insertMany(batch)
            .then((data) => {
              console.log("done pushing batch", counter);
              batch.splice(0, batch.length);
              console.log(batch.length);
            });
        }
      })

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
