// End-to-end smoke test. MEGA is replaced by an in-memory fake; ffmpeg is the real one.
//   npm test
process.env.NODE_ENV = "test";
process.env.ADMIN_USER = "admin";
process.env.ADMIN_PASSWORD = "pw-for-tests";
process.env.ADMIN_SECRET = "test-secret";
process.env.WORK_DIR = require("path").join(require("os").tmpdir(), "hls-admin-test-" + process.pid);

const test = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { spawnSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const { Writable, Readable } = require("stream");

/* ---- in-memory stand-in for megajs ---- */
function makeFakeStorage() {
  let n = 0;
  const storage = { files: {}, getAccountInfo: async () => ({ spaceUsed: 10, spaceTotal: 100 }) };
  class Node {
    constructor(name, directory, parent) {
      this.nodeId = "n" + ++n; this.name = name; this.directory = directory; this.parent = parent;
      this.children = directory ? [] : undefined; this.data = Buffer.alloc(0); this.timestamp = 1700000000;
      storage.files[this.nodeId] = this;
    }
    get size() { return this.data.length; }
    async mkdir(name) { const d = new Node(name, true, this); this.children.push(d); return d; }
    async rename(name) { this.name = name; }
    async delete() {
      this.parent.children = this.parent.children.filter((c) => c !== this);
      const drop = (x) => { delete storage.files[x.nodeId]; (x.children || []).forEach(drop); };
      drop(this);
    }
    download() { return Readable.from([this.data]); }
    upload(opts) {
      const parent = this, chunks = [];
      let done; const complete = new Promise((r) => (done = r));
      const w = new Writable({
        write(c, _, cb) { chunks.push(c); cb(); },
        final(cb) {
          const f = new Node(opts.name, false, parent);
          f.data = Buffer.concat(chunks); parent.children.push(f); done(f); cb();
        },
      });
      w.complete = complete;
      return w;
    }
  }
  storage.root = new Node("root", true, null);
  return storage;
}

const app = require("./index");
app.state.storage = makeFakeStorage();
app.state.isReady = true;

let base, token;
const server = http.createServer(app);
test.before(async () => {
  await new Promise((r) => server.listen(0, r));
  base = `http://127.0.0.1:${server.address().port}`;
});
test.after(() => { server.close(); fs.rmSync(process.env.WORK_DIR, { recursive: true, force: true }); setTimeout(() => process.exit(), 100); });

const api = (p, o = {}) =>
  fetch(base + "/admin/api" + p, {
    ...o,
    headers: { ...(token ? { Authorization: "Bearer " + token } : {}), ...(o.body && typeof o.body === "string" ? { "Content-Type": "application/json" } : {}) },
  });

test("admin page is served", async () => {
  const r = await fetch(base + "/admin");
  assert.equal(r.status, 200);
  assert.match(await r.text(), /HLS Admin/);
});

test("API requires login; wrong password rejected; right password accepted", async () => {
  assert.equal((await api("/stats")).status, 401);
  const bad = await api("/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "nope" }) });
  assert.equal(bad.status, 401);
  const ok = await api("/login", { method: "POST", body: JSON.stringify({ username: "admin", password: "pw-for-tests" }) });
  assert.equal(ok.status, 200);
  token = (await ok.json()).token;
  assert.equal((await api("/me")).status, 200);
});

test("file manager: folder, upload, rename, list, delete", async () => {
  const f = await (await api("/folder", { method: "POST", body: JSON.stringify({ parentId: "root", name: "docs" }) })).json();
  assert.equal(f.name, "docs");
  assert.equal((await api("/folder", { method: "POST", body: JSON.stringify({ parentId: "root", name: "docs" }) })).status, 409);

  const up = await api(`/upload?parentId=${f.id}&name=a.txt`, { method: "PUT", body: "hello" });
  assert.equal(up.status, 200);
  const file = await up.json();
  // overwrite keeps exactly one file
  await api(`/upload?parentId=${f.id}&name=a.txt`, { method: "PUT", body: "hello again" });
  let list = await (await api("/list?id=" + f.id)).json();
  assert.deepEqual(list.items.map((i) => i.name), ["a.txt"]);
  assert.equal(list.items[0].size, 11);

  const rn = await api("/rename", { method: "POST", body: JSON.stringify({ id: list.items[0].id, name: "b.txt" }) });
  assert.equal((await rn.json()).name, "b.txt");

  // deleting a folder AND its child in one batch must not fail
  const del = await api("/delete", { method: "POST", body: JSON.stringify({ ids: [f.id, list.items[0].id] }) });
  assert.equal(del.status, 200);
  assert.equal((await del.json()).deleted, 1);
  void file;
});

test("ffmpeg conversion -> HLS folder in storage -> public playback + video list", async (t) => {
  const ff = spawnSync("ffmpeg", ["-version"]);
  if (ff.status !== 0) return t.skip("ffmpeg not installed");
  const src = path.join(require("os").tmpdir(), "hls-test-src-" + process.pid + ".mp4");
  const gen = spawnSync("ffmpeg", ["-y", "-f", "lavfi", "-i", "testsrc=size=320x240:rate=25:duration=25",
    "-f", "lavfi", "-i", "sine=frequency=440:duration=25", "-c:v", "libx264", "-c:a", "aac", "-shortest", src]);
  assert.equal(gen.status, 0, "could not generate sample video");

  const r = await api(`/transcode?name=${encodeURIComponent("My Movie")}&filename=clip.mp4`, { method: "PUT", body: fs.readFileSync(src) });
  assert.equal(r.status, 202, await r.clone().text());
  const { id } = await r.json();

  let job;
  for (let i = 0; i < 120; i++) {
    job = await (await api("/jobs/" + id)).json();
    if (job.status === "done" || job.status === "failed") break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(job.status, "done", job.error);
  assert.equal(job.url, "/hls/My%20Movie/index.m3u8");

  const folder = app.state.storage.root.children.find((c) => c.name === "My Movie");
  const names = folder.children.map((c) => c.name);
  assert.ok(names.includes("index.m3u8"));
  assert.ok(names.filter((n) => n.endsWith(".ts")).length >= 2, "expected several segments");
  assert.equal(names[names.length - 1], "index.m3u8", "playlist must be uploaded last");

  const pl = await fetch(base + job.url);
  assert.equal(pl.status, 200);
  assert.equal(pl.headers.get("content-type"), "application/vnd.apple.mpegurl");
  assert.match(await pl.text(), /#EXTM3U/);
  const seg = await fetch(base + "/hls/My%20Movie/segment000.ts");
  assert.equal(seg.headers.get("content-type"), "video/MP2T");
  assert.ok((await seg.arrayBuffer()).byteLength > 1000);
  assert.equal((await fetch(base + "/hls/My%20Movie/missing.ts")).status, 404);

  const vids = await (await fetch(base + "/api/videos")).json();
  assert.deepEqual(vids.videos, [{ name: "My Movie", url: "/hls/My%20Movie/index.m3u8" }]);

  // re-converting under the same name replaces the folder content (no duplicates)
  const r2 = await api(`/transcode?name=${encodeURIComponent("My Movie")}&filename=clip.mp4`, { method: "PUT", body: fs.readFileSync(src) });
  const id2 = (await r2.json()).id;
  for (let i = 0; i < 120; i++) {
    job = await (await api("/jobs/" + id2)).json();
    if (job.status === "done" || job.status === "failed") break;
    await new Promise((r) => setTimeout(r, 500));
  }
  assert.equal(job.status, "done", job.error);
  assert.equal(app.state.storage.root.children.filter((c) => c.name === "My Movie").length, 1);
  assert.equal(folder.children.filter((c) => c.name === "index.m3u8").length, 1);
  fs.rmSync(src, { force: true });
});

test("a bad video fails cleanly and does not destroy an existing one", async () => {
  const before = app.state.storage.root.children.find((c) => c.name === "My Movie")?.children.length;
  const r = await api("/transcode?name=" + encodeURIComponent("My Movie") + "&filename=junk.mp4", { method: "PUT", body: "this is not a video" });
  const { id } = await r.json();
  let job;
  for (let i = 0; i < 60; i++) {
    job = await (await api("/jobs/" + id)).json();
    if (job.status === "done" || job.status === "failed") break;
    await new Promise((r) => setTimeout(r, 300));
  }
  assert.equal(job.status, "failed");
  assert.match(job.error, /ffmpeg failed/);
  const after = app.state.storage.root.children.find((c) => c.name === "My Movie")?.children.length;
  assert.equal(after, before);
});

test("invalid names are rejected", async () => {
  assert.equal((await api("/transcode?name=..&filename=a.mp4", { method: "PUT", body: "x" })).status, 400);
  assert.equal((await api("/transcode?name=a%2Fb&filename=a.mp4", { method: "PUT", body: "x" })).status, 400);
});
