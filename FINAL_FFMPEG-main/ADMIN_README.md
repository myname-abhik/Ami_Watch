# Admin panel

- UI: `public/admin/index.html` (served at `/admin`)
- API: `admin.js` (mounted from `index.js`, routes under `/admin/api/*`)

## Setup
Add to your `.env`:

    ADMIN_USER=admin
    ADMIN_PASSWORD=something-strong
    ADMIN_SECRET=long-random-string

Then `npm install && npm start` and open `http://localhost:PORT/admin`.

See `.env.example` for all settings. Your original `.env` is not included in this zip:
copy your own `.env` into this folder and add the three admin lines above.
