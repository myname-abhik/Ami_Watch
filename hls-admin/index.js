require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { Storage } = require("megajs");

const app = express();
app.disable("x-powered-by");
app.use(cors());

/* ---------------- MEGA login ---------------- */
// NOTE: MEGA_EMAIL / MEGA_PASSWORD, not USER / PASSWORD: USER is already set by the OS on
// Linux/macOS and dotenv never overrides it, which silently broke the login.
const state = { storage: null, isReady: false, loginError: null };
let settle;
const settled = new Promise((r) => (settle = r));
state.whenSettled = () => settled;

function connectMega(options = {}) {
  const storage = new Storage({
    email: process.env.MEGA_EMAIL,
    password: process.env.MEGA_PASSWORD,
    autologin: false,
    allowUploadBuffering: true,
    ...options,
  });
  state.storage = storage;
  storage.on("error", (err) => console.error("MEGA error:", err && err.message ? err.message : err));
  storage
    .login()
    .then(() => {
      state.isReady = true;
      console.log("✅ Logged into MEGA");
    })
    .catch((err) => {
      state.loginError = /without credentials/.test(err.message)
        ? "MEGA_EMAIL / MEGA_PASSWORD are not set in .env"
        : err.message;
      console.error("❌ MEGA login failed:", state.loginError);
    })
    .finally(settle);
}
if (process.env.NODE_ENV !== "test") connectMega(); // tests inject a fake storage instead

// The server starts listening right away, so /admin loads even while MEGA is still
// logging in (or if it failed) and shows a real error instead of a dead connection.
async function mega() {
  if (!state.isReady) await Promise.race([settled, new Promise((r) => setTimeout(r, 20000))]);
  return state.isReady ? state.storage : null;
}

/* ---------------- single admin panel ---------------- */
require("./admin")(app, () => state);

/* ---------------- public HLS delivery ---------------- */
app.get("/hls/:folderName/:filename", async (req, res) => {
  const { folderName, filename } = req.params;
  const storage = await mega();
  if (!storage) return res.status(503).send("Storage not ready yet");

  const folder = (storage.root.children || []).find((f) => f.directory && f.name === folderName);
  if (!folder) return res.status(404).send("Folder not found");

  const file = (folder.children || []).find((f) => !f.directory && f.name === filename);
  if (!file) return res.status(404).send("File not found");

  const isPlaylist = filename.endsWith(".m3u8");
  res.setHeader(
    "Content-Type",
    isPlaylist ? "application/vnd.apple.mpegurl" : filename.endsWith(".ts") ? "video/MP2T" : "application/octet-stream"
  );
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", isPlaylist ? "no-cache" : "public, max-age=3600");
  if (file.size) res.setHeader("Content-Length", file.size);

  const stream = file.download();
  stream.on("error", (err) => {
    console.error("[hls]", folderName, filename, err.message);
    if (!res.headersSent) res.status(502).send("Download failed");
    else res.destroy();
  });
  res.on("close", () => stream.destroy());
  stream.pipe(res);
});

// Public list used by the React player: every top-level folder that has an index.m3u8
app.get("/api/videos", async (req, res) => {
  const storage = await mega();
  if (!storage) return res.status(503).json({ error: "Storage not ready yet" });
  const videos = (storage.root.children || [])
    .filter((f) => f.directory && (f.children || []).some((c) => c.name === "index.m3u8"))
    .map((f) => ({ name: f.name, url: `/hls/${encodeURIComponent(f.name)}/index.m3u8` }))
    .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
  res.json({ videos });
});

/* ---------------- React player (built from ./frontend) ---------------- */
const dist = path.join(__dirname, "frontend", "dist");
if (fs.existsSync(dist)) app.use(express.static(dist));
else
  app.get("/", (req, res) =>
    res.type("text").send("HLS server is running. Admin: /admin. Build the player with: npm run build:frontend")
  );

/* ---------------- start ---------------- */
module.exports = app;
module.exports.connectMega = connectMega;
module.exports.state = state;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
}
