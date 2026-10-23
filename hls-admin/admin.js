// Admin API for the MEGA-backed HLS server (the ONE admin panel).
// Mounted from index.js:  require("./admin")(app, getState)
//   UI  -> GET  /admin
//   API -> /admin/api/*   (login, stats, list, folder, rename, delete, upload, transcode, jobs)

const crypto = require("crypto");
const express = require("express");
const fs = require("fs");
const fsp = fs.promises;
const path = require("path");
const { pipeline } = require("stream/promises");
const { checkFfmpeg, createJobQueue } = require("./transcode");

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours
const READY_WAIT_MS = 20 * 1000;

module.exports = function mountAdmin(app, getState) {
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const SECRET = process.env.ADMIN_SECRET || crypto.randomBytes(32).toString("hex"); // random => sessions reset on restart

  const router = express.Router();
  const queue = createJobQueue(async () => (await ensureReady()).storage);
  let ffmpegOk = false;
  checkFfmpeg().then((ok) => {
    ffmpegOk = ok;
    if (!ok) console.warn("⚠️  ffmpeg not found: video conversion is disabled (install ffmpeg or set FFMPEG_PATH)");
  });

  /* ---------------- helpers ---------------- */

  const b64 = (buf) => Buffer.from(buf).toString("base64url");
  const sign = (data) => crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

  const safeEqual = (a, b) => {
    const ha = crypto.createHash("sha256").update(String(a)).digest();
    const hb = crypto.createHash("sha256").update(String(b)).digest();
    return crypto.timingSafeEqual(ha, hb);
  };

  function makeToken(user) {
    const body = b64(JSON.stringify({ u: user, exp: Date.now() + TOKEN_TTL_MS }));
    return `${body}.${sign(body)}`;
  }

  function verifyToken(token) {
    if (!token || !token.includes(".")) return null;
    const [body, sig] = token.split(".");
    if (!safeEqual(sig, sign(body))) return null;
    try {
      const data = JSON.parse(Buffer.from(body, "base64url").toString());
      return data.exp > Date.now() ? data : null;
    } catch {
      return null;
    }
  }

  // small in-memory brute-force limiter for /login
  const attempts = new Map(); // ip -> { count, resetAt }
  const loginAllowed = (ip) => {
    const rec = attempts.get(ip);
    return !rec || rec.resetAt < Date.now() || rec.count < 8;
  };
  const loginFailed = (ip) => {
    const now = Date.now();
    const rec = attempts.get(ip);
    if (!rec || rec.resetAt < now) attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    else rec.count++;
  };

  const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error("[admin]", err);
      if (!res.headersSent) res.status(err.status || 500).json({ error: err.message || "Internal error" });
    });

  // Waits (briefly) for the MEGA login instead of failing the first requests after boot
  async function ensureReady() {
    let st = getState();
    if (!st.isReady && st.whenSettled)
      await Promise.race([st.whenSettled(), new Promise((r) => setTimeout(r, READY_WAIT_MS))]);
    st = getState();
    if (!st.isReady) {
      const e = new Error(
        st.loginError ? `MEGA login failed: ${st.loginError}` : "Storage not ready yet, try again in a moment"
      );
      e.status = 503;
      throw e;
    }
    return st;
  }

  function requireConfigured(req, res, next) {
    if (!ADMIN_USER || !ADMIN_PASSWORD)
      return res.status(503).json({ error: "Admin disabled: set ADMIN_USER and ADMIN_PASSWORD in .env" });
    next();
  }

  function requireAuth(req, res, next) {
    const h = req.headers.authorization || "";
    if (!verifyToken(h.startsWith("Bearer ") ? h.slice(7) : null))
      return res.status(401).json({ error: "Unauthorized" });
    next();
  }

  const storageMw = (req, res, next) => {
    ensureReady().then(
      ({ storage }) => {
        req.storage = storage;
        next();
      },
      (err) => res.status(err.status || 500).json({ error: err.message })
    );
  };

  function findNode(storage, id) {
    if (!id || id === "root") return storage.root;
    const node = storage.files && storage.files[id];
    if (!node) {
      const e = new Error("Item not found");
      e.status = 404;
      throw e;
    }
    return node;
  }

  const cleanName = (n) => {
    n = String(n || "").trim();
    if (!n || n.includes("/") || n.includes("\\") || n === "." || n === "..") return null;
    return n;
  };

  function serialize(storage, node) {
    const ts = node.timestamp || 0;
    const item = {
      id: node.nodeId,
      name: node.name,
      directory: !!node.directory,
      size: node.size || 0,
      timestamp: ts && ts < 1e12 ? ts * 1000 : ts,
      hlsUrl: null,
    };
    // The public /hls route only serves files that sit one level below the root
    if (!node.directory && node.parent && node.parent.parent === storage.root) {
      item.hlsUrl = `/hls/${encodeURIComponent(node.parent.name)}/${encodeURIComponent(node.name)}`;
    }
    return item;
  }

  function breadcrumb(storage, node) {
    const out = [];
    for (let cur = node; cur && cur !== storage.root; cur = cur.parent)
      out.unshift({ id: cur.nodeId, name: cur.name });
    return out;
  }

  function walk(node, acc) {
    for (const c of node.children || []) {
      if (c.directory) {
        acc.folders++;
        walk(c, acc);
      } else {
        acc.files++;
        acc.bytes += c.size || 0;
      }
    }
    return acc;
  }

  /* ---------------- routes ---------------- */

  // The UI page itself is always reachable (so a missing config shows a readable message)
  router.get("/", (req, res) => res.sendFile(path.join(__dirname, "public", "admin", "index.html")));

  router.post("/api/login", requireConfigured, express.json(), (req, res) => {
    const ip = req.ip;
    if (!loginAllowed(ip)) return res.status(429).json({ error: "Too many attempts, try again later" });
    const { username, password } = req.body || {};
    if (username && password && safeEqual(username, ADMIN_USER) && safeEqual(password, ADMIN_PASSWORD)) {
      attempts.delete(ip);
      return res.json({ token: makeToken(username), expiresIn: TOKEN_TTL_MS });
    }
    loginFailed(ip);
    res.status(401).json({ error: "Invalid username or password" });
  });

  // Everything below needs a valid token. Jobs/me do not need MEGA to be ready.
  router.use("/api", requireConfigured, requireAuth);

  router.get("/api/me", (req, res) => res.json({ ok: true }));

  router.get("/api/jobs", (req, res) => res.json({ ffmpeg: ffmpegOk, jobs: queue.list() }));

  router.get("/api/jobs/:id", (req, res) => {
    const job = queue.get(req.params.id);
    if (!job) return res.status(404).json({ error: "Job not found" });
    res.json(job);
  });

  // Upload a raw video -> ffmpeg -> HLS -> MEGA folder.
  //   PUT /admin/api/transcode?name=<folder name>&filename=<original file name>   (raw body)
  router.put(
    "/api/transcode",
    wrap(async (req, res) => {
      if (!ffmpegOk)
        return res.status(503).json({ error: "ffmpeg is not installed on the server (or FFMPEG_PATH is wrong)" });
      const name = cleanName(req.query.name);
      if (!name) return res.status(400).json({ error: "Invalid video name" });

      const ext = path.extname(String(req.query.filename || "")).toLowerCase().replace(/[^.a-z0-9]/g, "").slice(0, 10);
      const id = queue.newId();
      await fsp.mkdir(queue.workDir, { recursive: true });
      const inputPath = path.join(queue.workDir, `${id}-input${ext}`);
      try {
        await pipeline(req, fs.createWriteStream(inputPath)); // stream straight to disk
      } catch (err) {
        fsp.rm(inputPath, { force: true }).catch(() => {});
        throw err;
      }
      res.status(202).json(queue.add({ id, name, originalName: String(req.query.filename || ""), inputPath }));
    })
  );

  // MEGA-backed routes
  router.use("/api", storageMw);

  router.get(
    "/api/stats",
    wrap(async (req, res) => {
      const { storage } = req;
      const counts = walk(storage.root, { files: 0, folders: 0, bytes: 0 });
      let account = null;
      try {
        const info = await storage.getAccountInfo();
        account = { used: info.spaceUsed, total: info.spaceTotal };
      } catch {
        /* non-fatal */
      }
      res.json({
        ...counts,
        topLevelFolders: (storage.root.children || []).filter((c) => c.directory).length,
        account,
        ffmpeg: ffmpegOk,
      });
    })
  );

  router.get(
    "/api/list",
    wrap(async (req, res) => {
      const { storage } = req;
      const node = findNode(storage, req.query.id);
      if (!node.directory) return res.status(400).json({ error: "Not a folder" });
      const items = (node.children || [])
        .map((c) => serialize(storage, c))
        .sort((a, b) =>
          a.directory !== b.directory ? (a.directory ? -1 : 1) : a.name.localeCompare(b.name, undefined, { numeric: true })
        );
      res.json({ id: node === storage.root ? "root" : node.nodeId, path: breadcrumb(storage, node), items });
    })
  );

  router.post(
    "/api/folder",
    express.json(),
    wrap(async (req, res) => {
      const { storage } = req;
      const parent = findNode(storage, req.body.parentId);
      const name = cleanName(req.body.name);
      if (!name) return res.status(400).json({ error: "Invalid folder name" });
      if ((parent.children || []).some((c) => c.name === name))
        return res.status(409).json({ error: "An item with that name already exists" });
      res.json(serialize(storage, await parent.mkdir(name)));
    })
  );

  router.post(
    "/api/rename",
    express.json(),
    wrap(async (req, res) => {
      const { storage } = req;
      const node = findNode(storage, req.body.id);
      if (node === storage.root) return res.status(400).json({ error: "Cannot rename root" });
      const name = cleanName(req.body.name);
      if (!name) return res.status(400).json({ error: "Invalid name" });
      if ((node.parent.children || []).some((c) => c !== node && c.name === name))
        return res.status(409).json({ error: "An item with that name already exists" });
      await node.rename(name);
      res.json(serialize(storage, node));
    })
  );

  // Delete (moves to MEGA rubbish bin unless permanent=true)
  router.post(
    "/api/delete",
    express.json(),
    wrap(async (req, res) => {
      const { storage } = req;
      const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
      const permanent = !!req.body.permanent;
      let deleted = 0;
      for (const id of ids) {
        let node;
        try {
          node = findNode(storage, id);
        } catch (e) {
          if (e.status === 404) continue; // already gone, e.g. a child of a folder deleted earlier in this batch
          throw e;
        }
        if (node === storage.root) continue;
        await node.delete(permanent);
        deleted++;
      }
      res.json({ deleted });
    })
  );

  // Plain file upload (e.g. already-converted .m3u8/.ts):  PUT /admin/api/upload?parentId=<id>&name=<filename>
  router.put(
    "/api/upload",
    wrap(async (req, res) => {
      const { storage } = req;
      const parent = findNode(storage, req.query.parentId);
      const name = cleanName(req.query.name);
      if (!name) return res.status(400).json({ error: "Invalid file name" });
      const size = Number(req.headers["content-length"]);

      const existing = (parent.children || []).find((c) => c.name === name && !c.directory);

      const opts = { name, allowUploadBuffering: true };
      if (size > 0) opts.size = size;
      const up = parent.upload(opts);
      const complete = up.complete;
      complete.catch(() => {});
      await pipeline(req, up);
      const file = await complete;
      // replace only after the new file is safely stored
      if (existing) await existing.delete(true);
      res.json(serialize(storage, file));
    })
  );

  app.use("/admin", router);

  if (!ADMIN_USER || !ADMIN_PASSWORD)
    console.warn("⚠️  Admin login disabled: set ADMIN_USER and ADMIN_PASSWORD in .env");
  else {
    console.log("🛠  Admin panel at /admin");
    if (!process.env.ADMIN_SECRET)
      console.warn("⚠️  ADMIN_SECRET not set: admins will be signed out on every restart");
  }
};
