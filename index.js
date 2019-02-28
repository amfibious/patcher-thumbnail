const express = require("express"),
  jwt = require("jsonwebtoken"),
  jsonpatch = require("jsonpatch"),
  { auth, secret } = require("./middlewares/auth"),
  request = require("request"),
  fs = require("fs"),
  sharp = require("sharp");

const app = express();
const isProduction = app.get("env") === "production";
const appName = "Hackerbay";
const description = "Json Patcher and Image Thumbnail Generation Service";
//------------------------------------------------------------

// ------------- Middlewares -------------------
//Parse Request body with json payload
app.use(express.json());
//Parse request body with url-encoded payload
app.use(express.urlencoded({ extended: true }));

// development error handler
// will print stacktrace
if (!isProduction) {
  app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.status(err.status || 500);
    res.json({
      errors: {
        message: err.message,
        error: err
      }
    });
  });
}

// -------------- Routes ------------------------
//
app.get("/", (req, res) => {
  res.send(`<h1>${appName}</h1> 
    <h2>${description}</h2>
    <p>By Sunrise Ezekikwu</p>`);
});

//POST: /login
app.post("/login", async (req, res) => {
  let user = req.body.username;
  let password = req.body.password;
  if (!(user && password)) {
    return res.status(400).send("Bad request. No username or password");
  }
  const token = jwt.sign({ user: user }, secret);
  return res.status(200).send(JSON.stringify(token));
});

//POST: /patch
app.post("/patch", auth, (req, res) => {
  var doc = req.body.doc;
  var patch = req.body.patch;
  if (!(doc && patch)) {
    return res.status(400).send("Incorrect input format");
  }
  var patched = jsonpatch.apply_patch(doc, patch);
  res.status(200).send(patched);
});

//GET: /thumbnail
app.get("/thumbnail", (req, res) => {
  let imageUrl = req.query["imageUrl"];

  var download = (uri, filename, callback) => {
    request.head(uri, (err, resp, body) => {
      if (!resp) {
        return callback;
      }
      //   console.log("content-type:", resp.headers["content-type"]);
      console.log("content-length:", resp.headers["content-length"]);
      let mimeType = resp.headers["content-type"];
      let extension = resp.headers["content-type"].split("/")[1];
      let fullName = filename + "." + extension;
      let stream = fs.createWriteStream(fullName);
      let prefix = `data:${mimeType};base64,`;
      // request(uri)
      //   .pipe(stream)
      //   .on("close", () => {
      //     request(uri, (err, data, bod) => {
      //       let prefix = `data:${mimeType};base64,`;
      //       sharp(fullName)
      //         .resize(50, 50)
      //         .toBuffer((err, buffer, info) => {
      //           console.log(err);
      //           console.log(info);
      //           console.log(buffer);
      //           callback(buffer, mimeType);
      //         })
      //         .end();
      //       // console.log(URL.createObjectURL(escape(data.body)));
      //     });
      //   });
      request.get(uri, (err, data, body) => {
        // let stream = new ReadableStream(data);
        // console.log(new Buffer(escape(data.body)).toString("base64"));
        // sharp(new Buffer(escape(body), "base64").toString("base64"))
        //   .resize(50, 50)
        //   .toBuffer((err, buffer, info) => {
        //     console.log(err);
        //     console.log(info);
        //     console.log(buffer);
        //     callback(buffer, mimeType);
        //   })
        //   .end();
        callback(
          new Buffer(escape(body), "base64").toString("base64"),
          mimeType
        );
      });
    });
  };

  download(imageUrl, "download", (data, mimeType) => {
    console.log("done");
    // fs.readFile()
    res.setHeader("Content-Type", mimeType);
    res.send(data);
  });
});

app.get("**", (req, res) => {
  res.send(`<h1>RESOURCE NOT FOUND</h1>`);
});

//-------------- Server -----------------------
const port = process.env.PORT || 3000;
var server = app.listen(port, () =>
  console.log(`Application Started! Listening on port ${server.address().port}`)
);
