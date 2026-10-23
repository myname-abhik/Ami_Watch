// ffmpeg helpers + a small sequential job queue:
//   uploaded video -> ffmpeg (HLS) -> MEGA folder named after the video
// Uses spawn() with an argument array (no shell), so file names can never inject commands.

const { spawn } = require("child_process");
const fs = require("fs");
const fsp = fs.promises;
const os = require("os");
const path = require("path");
const crypto = require("crypto");

const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
const FFPROBE = process.env.FFPROBE_PATH || "ffprobe";
const WORK_DIR = process.env.WORK_DIR || path.join(os.tmpdir(), "hls-admin");
const KEEP_JOBS = 50;

function checkFfmpeg() {
  return new Promise((resolve) => {
    const p = spawn(FFMPEG, ["-version"], { stdio: "ignore" });
    p.on("error", () => resolve(false));
    p.on("close", (code) => resolve(code === 0));
  });
}

function probeDuration(file) {
  return new Promise((resolve) => {
    const p = spawn(
      FFPROBE,
      ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", file],
      { stdio: ["ignore", "pipe", "ignore"] }
    );
    let out = "";
    p.stdout.on("data", (d) => (out += d));
    p.on("error", () => resolve(null));
    p.on("close", () => {
      const n = parseFloat(out);
      resolve(Number.isFinite(n) && n > 0 ? n : null);
    });
  });
}

// Converts `input` to outDir/index.m3u8 + outDir/segmentNNN.ts
function convertToHls(input, outDir, durationSec, onProgress) {
  return new Promise((resolve, reject) => {
    const args = [
      "-y", "-nostdin", "-i", input,
      "-map", "0:v:0", "-map", "0:a:0?", "-sn",
      "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p",
      "-c:a", "aac",
      "-hls_time", "10", "-hls_playlist_type", "vod",
      "-hls_segment_filename", path.join(outDir, "segment%03d.ts"),
      "-start_number", "0",
      "-progress", "pipe:1", "-nostats",
      path.join(outDir, "index.m3u8"),
    ];
    const p = spawn(FFMPEG, args, { stdio: ["ignore", "pipe", "pipe"] });
    let errTail = "";
    let buf = "";
    p.stderr.on("data", (d) => (errTail = (errTail + d).slice(-2000)));
    p.stdout.on("data", (d) => {
      buf += d;
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        const m = /^out_time_(?:us|ms)=(\d+)/.exec(line); // both are microseconds
        if (m && durationSec && onProgress)
          onProgress(Math.min(99, Math.round((Number(m[1]) / 1e6 / durationSec) * 100)));
      }
    });
    p.on("error", (e) =>
      reject(new Error(e.code === "ENOENT" ? "ffmpeg is not installed (or FFMPEG_PATH is wrong)" : e.message))
    );
    p.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error("ffmpeg failed: " + (errTail.trim().split("\n").slice(-3).join(" | ") || "exit " + code)))
    );
  });
}

function uploadFile(folder, name, filePath, size) {
  return new Promise((resolve, reject) => {
    const up = folder.upload({ name, size });
    up.on("error", reject);
    if (up.complete) up.complete.then(resolve, reject);
    else up.on("complete", resolve);
    const rs = fs.createReadStream(filePath);
    rs.on("error", (e) => {
      up.destroy(e);
      reject(e);
    });
    rs.pipe(up);
  });
}

function createJobQueue(getStorage) {
  const jobs = new Map(); // id -> job (insertion ordered)
  const inputs = new Map(); // id -> input file path (kept private)
  const pending = [];
  let running = false;

  // leftovers from a crashed run
  fsp.rm(WORK_DIR, { recursive: true, force: true }).catch(() => {});

  const view = (j) => ({ ...j });

  function trim() {
    while (jobs.size > KEEP_JOBS) {
      const [id, j] = jobs.entries().next().value;
      if (j.status === "queued" || j.status === "converting" || j.status === "uploading") break;
      jobs.delete(id);
    }
  }

  async function run(job) {
    const input = inputs.get(job.id);
    const outDir = path.join(WORK_DIR, job.id + "-out");
    try {
      job.status = "converting";
      job.stage = "Converting";
      await fsp.mkdir(outDir, { recursive: true });
      const duration = await probeDuration(input);
      await convertToHls(input, outDir, duration, (p) => (job.progress = p));
      job.progress = 100;

      job.status = "uploading";
      job.stage = "Uploading to MEGA";
      job.progress = 0;
      const storage = await getStorage();

      let folder = (storage.root.children || []).find((c) => c.directory && c.name === job.name);
      if (!folder) folder = await storage.root.mkdir(job.name);
      // conversion succeeded, so it is now safe to replace what was there before
      for (const old of [...(folder.children || [])]) await old.delete(true);

      const names = (await fsp.readdir(outDir)).sort();
      // playlist last, so players never see it before its segments exist
      names.sort((a, b) => (a === "index.m3u8") - (b === "index.m3u8"));
      let done = 0;
      for (const n of names) {
        const p = path.join(outDir, n);
        await uploadFile(folder, n, p, (await fsp.stat(p)).size);
        job.progress = Math.round((++done / names.length) * 100);
      }
      job.url = `/hls/${encodeURIComponent(job.name)}/index.m3u8`;
      job.status = "done";
      job.stage = "Done";
    } catch (err) {
      console.error("[transcode]", job.id, err);
      job.status = "failed";
      job.stage = "Failed";
      job.error = err.message || String(err);
    } finally {
      job.finishedAt = Date.now();
      inputs.delete(job.id);
      fsp.rm(input, { force: true }).catch(() => {});
      fsp.rm(outDir, { recursive: true, force: true }).catch(() => {});
      trim();
    }
  }

  async function pump() {
    if (running) return;
    running = true;
    while (pending.length) await run(pending.shift());
    running = false;
  }

  return {
    workDir: WORK_DIR,
    newId: () => crypto.randomBytes(8).toString("hex"),
    add({ id, name, originalName, inputPath }) {
      const job = {
        id, name, originalName,
        status: "queued", stage: "Queued", progress: 0,
        error: null, url: null, createdAt: Date.now(), finishedAt: null,
      };
      jobs.set(id, job);
      inputs.set(id, inputPath);
      pending.push(job);
      pump();
      return view(job);
    },
    list: () => [...jobs.values()].reverse().map(view),
    get: (id) => (jobs.has(id) ? view(jobs.get(id)) : null),
  };
}

module.exports = { checkFfmpeg, createJobQueue, WORK_DIR };
