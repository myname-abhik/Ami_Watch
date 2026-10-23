# HLS server + single admin panel

One Node server that does everything:

| URL | What |
|---|---|
| `/admin` | **The admin panel** – MEGA file manager (folders, upload, rename, delete, preview) **and** "Convert video" |
| `/hls/<folder>/<file>` | Public HLS delivery straight from MEGA |
| `/api/videos` | Public list of videos (folders that contain `index.m3u8`) |
| `/` | React player (video.js) – built from `frontend/` |

## How "Convert video" works
Admin panel → **Convert video** → pick any video file → give it a name.
The server streams it to disk, runs ffmpeg (H.264/AAC, 10 s HLS segments), uploads the
segments and then `index.m3u8` to a MEGA folder called `<name>`, and cleans up.
Re-converting under the same name replaces the old version only after the new one succeeded.
Playback URL: `/hls/<name>/index.m3u8`. Jobs run one at a time; progress shows in the panel.

## Setup
Requires Node 18+ and **ffmpeg** on the PATH (for conversion).

    cp .env.example .env        # fill in MEGA_* and ADMIN_*
    npm install
    npm run build:frontend      # builds the player into frontend/dist
    npm start                   # http://localhost:3000  (admin at /admin)

Development: `npm run dev` (server) and `npm --prefix frontend run dev` (player on :5173, proxied to :3000).
Tests: `npm test` (uses an in-memory MEGA fake + real ffmpeg).

## Notes
- Conversion needs a long-running host with ffmpeg and disk space. It will not work on Vercel
  (no ffmpeg, request size limits); `/hls` and the admin file manager are fine there.
- Never commit `.env`.
