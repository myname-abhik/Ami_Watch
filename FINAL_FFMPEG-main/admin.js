// Admin API for the MEGA-backed HLS server.
// Mounted from index.js:  require("./admin")(app, () => ({ storage, isReady }));
// No extra dependencies: auth uses Node's crypto, uploads stream the raw request body.

const crypto = require("crypto");
const express = require("express");
const path = require("path");

const TOKEN_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

module.exports = function mountAdmin(app, getState) {
  const ADMIN_USER = process.env.ADMIN_USER;
  const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
  const SECRET =
    process.env.ADMIN_SECRET || crypto.randomBytes(32).toString("hex"); // random => sessions reset on restart

  const router = express.Router();

  /* ---------------- helpers ---------------- */

  const b64 = (buf) => Buffer.from(buf).toString("base64url");
  const sign = (data) =>
    crypto.createHmac("sha256", SECRET).update(data).digest("base64url");

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

  // very small in-memory brute-force limiter for /login
  const attempts = new Map(); // ip -> { count, resetAt }
  function loginAllowed(ip) {
    const now = Date.now();
    const rec = attempts.get(ip);
    if (!rec || rec.resetAt < now) return true;
    return rec.count < 8;
  }
  function loginFailed(ip) {
    const now = Date.now();
    const rec = attempts.get(ip);
    if (!rec || rec.resetAt < now)
      attempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    else rec.count++;
  }

  const wrap = (fn) => (req, res) =>
    Promise.resolve(fn(req, res)).catch((err) => {
      console.error("[admin]", err);
      if (!res.headersSent)
        res.status(500).json({ error: err.message || "Internal error" });
    });

  function requireConfigured(req, res, next) {
    if (!ADMIN_USER || !ADMIN_PASSWORD)
      return res.status(503).json({
        error: "Admin disabled: set ADMIN_USER and ADMIN_PASSWORD in .env",
      });
    next();
  }

  function requireAuth(req, res, next) {
    const h = req.headers.authorization || "";
    const token = h.startsWith("Bearer ") ? h.slice(7) : req.query.token;
    if (!verifyToken(token)) return res.status(401).json({ error: "Unauthorized" });
    next();
  }

  function requireStorage(req, res, next) {
    const { storage, isReady } = getState();
    if (!isReady) return res.status(503).json({ error: "Storage not ready yet" });
    req.storage = storage;
    next();
  }

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
    if (!n || n.includes("/") || n.includes("\\") || n === "." || n === "..")
      return null;
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
    let cur = node;
    while (cur && cur !== storage.root) {
      out.unshift({ id: cur.nodeId, name: cur.name });
      cur = cur.parent;
    }
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

  router.use(requireConfigured);

  router.post("/api/login", express.json(), (req, res) => {
    const ip = req.ip;
    if (!loginAllowed(ip))
      return res.status(429).json({ error: "Too many attempts, try again later" });
    const { username, password } = req.body || {};
    if (
      username &&
      password &&
      safeEqual(username, ADMIN_USER) &&
      safeEqual(password, ADMIN_PASSWORD)
    ) {
      attempts.delete(ip);
      return res.json({ token: makeToken(username), expiresIn: TOKEN_TTL_MS });
    }
    loginFailed(ip);
    res.status(401).json({ error: "Invalid username or password" });
  });

  router.use("/api", (req, res, next) => {
    if (req.path === "/login") return next();
    requireAuth(req, res, () => requireStorage(req, res, next));
  });

  router.get("/api/me", (req, res) => res.json({ ok: true }));

  // Dashboard numbers
  router.get(
    "/api/stats",
    wrap(async (req, res) => {
      const { storage } = req;
      const counts = walk(storage.root, { files: 0, folders: 0, bytes: 0 });
      let account = null;
      try {
        const info = await storage.getAccountInfo();
        account = { used: info.spaceUsed, total: info.spaceTotal };
      } catch {}
      res.json({
        ...counts,
        topLevelFolders: (storage.root.children || []).filter((c) => c.directory).length,
        account,
      });
    })
  );

  // List a folder
  router.get(
    "/api/list",
    wrap(async (req, res) => {
      const { storage } = req;
      const node = findNode(storage, req.query.id);
      if (!node.directory) return res.status(400).json({ error: "Not a folder" });
      const items = (node.children || [])
        .map((c) => serialize(storage, c))
        .sort((a, b) =>
          a.directory !== b.directory
            ? a.directory ? -1 : 1
            : a.name.localeCompare(b.name, undefined, { numeric: true })
        );
      res.json({
        id: node === storage.root ? "root" : node.nodeId,
        path: breadcrumb(storage, node),
        items,
      });
    })
  );

  // New folder
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
      const folder = await parent.mkdir(name);
      res.json(serialize(storage, folder));
    })
  );

  // Rename
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
        const node = findNode(storage, id);
        if (node === storage.root) continue;
        await node.delete(permanent);
        deleted++;
      }
      res.json({ deleted });
    })
  );

  // Upload: PUT raw file body.  /admin/api/upload?parentId=<id>&name=<filename>
  router.put(
    "/api/upload",
    wrap(async (req, res) => {
      const { storage } = req;
      const parent = findNode(storage, req.query.parentId);
      const name = cleanName(req.query.name);
      if (!name) return res.status(400).json({ error: "Invalid file name" });
      const size = Number(req.headers["content-length"]);

      // overwrite semantics: replace an existing file of the same name
      const existing = (parent.children || []).find((c) => c.name === name && !c.directory);
      if (existing) await existing.delete(true);

      const opts = { name, allowUploadBuffering: true };
      if (size > 0) opts.size = size;
      const up = parent.upload(opts);
      req.pipe(up);
      req.on("aborted", () => up.destroy(new Error("Upload aborted")));
      const file = await up.complete;
      res.json(serialize(storage, file));
    })
  );

  // Static admin UI
  router.get("/", (req, res) =>
    res.sendFile(path.join(__dirname, "public", "admin", "index.html"))
  );

  // Registered before requireConfigured would block the UI itself
  app.get("/admin", (req, res) =>
    res.sendFile(path.join(__dirname, "public", "admin", "index.html"))
  );
  app.use("/admin", router);

  if (!ADMIN_USER || !ADMIN_PASSWORD)
    console.warn("⚠️  Admin panel disabled: set ADMIN_USER and ADMIN_PASSWORD in .env");
  else console.log("🛠  Admin panel at /admin");
};
