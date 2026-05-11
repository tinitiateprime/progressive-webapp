# Tinitiate Tutorial PWA

This project is a `Next.js` progressive web app for reading tutorial content from GitHub markdown files.

## Main features

- User signup and login with `NextAuth`
- Dashboard with subjects and topics
- Topic reader with markdown rendering and code highlighting
- Save subjects for offline reading
- Per-user favorites

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Important folders

- `src/pages` - app pages and API routes
- `src/lib` - auth, offline, favorites, parsing helpers
- `data` - simple JSON storage for users and favorites
- `public` - static files and generated PWA assets
