
const express = require("express");
const cors = require("cors");
const { Storage } = require("megajs");
require("dotenv").config();

const app = express();
app.use(cors());

const storage = new Storage({
  email: process.env.USER,
  password: process.env.PASSWORD,
  autologin: false,
  allowUploadBuffering: true,
});

let isReady = false;

storage.on("ready", () => {
  console.log("✅ Logged into MEGA");
  isReady = true;

  app.listen(process.env.PORT, () =>
    console.log(`🚀 Server running at http://localhost:${process.env.PORT}`)
  );
});

storage.on("error", (err) => {
  console.error("❌ MEGA login failed:", err);
});

storage.login();

// Admin panel (UI at /admin, API at /admin/api/*)
require("./admin")(app, () => ({ storage, isReady }));

app.get("/hls/:folderName/:filename", (req, res) => {
  const { folderName, filename } = req.params;

  if (!isReady) {
    return res.status(503).send("Storage not ready yet");
  }

  const folder = storage.root.children.find((f) => f.name === folderName);
  if (!folder) return res.status(404).send("Folder not found");

  const file = folder.children.find((f) => f.name === filename);
  if (!file) return res.status(404).send("File not found");

  const stream = file.download();

  const contentType = filename.endsWith(".m3u8")
    ? "application/vnd.apple.mpegurl"
    : filename.endsWith(".ts")
    ? "video/MP2T"
    : "application/octet-stream";

  res.setHeader("Content-Type", contentType);
  res.setHeader("Access-Control-Allow-Origin", "*");

  stream.pipe(res);
});

