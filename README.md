# Smart Water Guardian backend

This project now includes a small Node.js backend using only built-in modules. It serves the frontend, stores application data in `data/store.json`, and exposes a same-origin JSON API.

## Start

Install Node.js 18 or newer, open a terminal in this folder, and run:

```sh
npm start
```

Then open `http://127.0.0.1:3000`. The data file and demo account are created automatically on first launch.

**Demo login:** `demo@gniot.net.in` / `Water@1234`

## API

- `POST /api/auth/signup`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/auth/session`
- `GET /api/zones`
- `GET /api/reports`, `POST /api/reports`
- `PATCH /api/profile`
- `GET /api/settings`, `PUT /api/settings`
- `GET /api/health`

Authentication uses an HTTP-only same-site session cookie. Passwords are stored as salted scrypt hashes. The prototype’s campus readings remain illustrative; `/api/zones` returns the same sample data shown by the dashboard.
