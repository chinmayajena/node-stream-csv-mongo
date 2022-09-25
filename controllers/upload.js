var cuid = require("cuid");
var Busboy = require("busboy");
const csv = require("csv");
const streamifier = require("streamifier");
var fs = require("fs");

const options = { auto_parse: true, columns: true, relax_column_count: true };

module.exports.uploadCSV = function (req, res, next) {
  let busboy = Busboy({ headers: req.headers });
  const parser = csv.parse(options);
  const writeStream = fs.createWriteStream("../../myfile.json", { flags: "a" });
  const queue = new BatchingQueue({
    store: new MemoryStore(),
    batchSize: 12,
  });

  const db = req.app.locals.db;
  let dbase = db.db("yobulk");
  let collectionName = cuid();
  dbase.createCollection(collectionName, function (err, res) {
    if (err) throw err;
  });
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
    let counter = 0;
    file
      .pipe(parser)
      .on("readable", function () {
        let record;
        while ((record = parser.read()) !== null) {
          if (counter === 0) {
            writeStream.write("[");
            writeStream.write(JSON.stringify(record) + ",");
            counter++;
          } else {
            writeStream.write(JSON.stringify(record) + ",");
          }
        }
      })
      .on("end", function () {
        writeStream.write("]");
        /*   dbase.collection(collectionName).insertMany([
         
        ]); */
      })
      //.pipe(writeStream)
      //.on("data", (row) => myFile.write(JSON.stringify(row)))
      /*       .on("data", async (row) => {
        await dbase
          .collection(collectionName)
          .insertOne(row, function (err, res) {
            if (err) throw err;
            // console.log("1 record inserted");
          });
      }) */
      // .pipe(myFile)
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
