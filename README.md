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

Open `http://localhost:3001`.

## Google OAuth

Set these environment variables before using Google login or signup:

```bash
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

`GOOGLE_CLIENT_ID` is required for the visible Google login/signup button. `GOOGLE_CLIENT_SECRET` is recommended for deployments and enables the full NextAuth redirect OAuth flow. Without a client secret, the app falls back to Google Identity Services in the browser and verifies the Google access token on the server before creating a NextAuth session.

The app also accepts `GOOGLE_ID`/`GOOGLE_SECRET`, `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, and `AUTH_GOOGLE_CLIENT_ID`/`AUTH_GOOGLE_CLIENT_SECRET`. Restart the dev server or redeploy after changing auth environment variables.

For local development, add this authorized redirect URI in Google Cloud:

```text
http://localhost:3001/api/auth/callback/google
```

Also add this authorized JavaScript origin:

```text
http://localhost:3001
```

### Netlify deployment

In Netlify, add these environment variables under Site configuration -> Environment variables:

```bash
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=https://your-site.netlify.app
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Use the exact deployed site origin. Do not set `NEXTAUTH_URL` to `http://localhost:3001` in Netlify. If you use a custom domain, use that custom domain instead.

In Google Cloud Console -> APIs & Services -> Credentials -> your OAuth 2.0 Client ID, add this authorized redirect URI:

```text
https://your-site.netlify.app/api/auth/callback/google
```

If you deploy without `GOOGLE_CLIENT_SECRET`, also add this authorized JavaScript origin:

```text
https://your-site.netlify.app
```

For a custom domain, add the same entries with the custom domain too. Do not include a trailing slash.

## Important folders

- `src/pages` - app pages and API routes
- `src/lib` - auth, offline, favorites, parsing helpers
- `data` - simple JSON storage for users and favorites
- `public` - static files and generated PWA assets
