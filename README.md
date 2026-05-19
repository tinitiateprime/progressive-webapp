# Tinitiate Learning PWA

Tinitiate Learning PWA is a Next.js progressive web app for learners. It gives users one place to open courses, interview Q&A, CBT slides/videos/audio, save favorite topics, and continue reading with offline-ready caching.

The app code is in this folder: `progressive-webapp/`.

## Current Health Check

Last checked on May 18, 2026:

```bash
npm run lint
npm run typecheck
npm run build
```

All three commands passed. The production build also generated the PWA service worker at `public/sw.js`. That file and `public/workbox-*.js` are generated build files and are ignored by Git.

## Tech Stack

- Next.js 16 pages router
- React 19
- TypeScript
- NextAuth for email/password and Google login
- next-pwa and Workbox for install/offline support
- Markdown content loaded from a GitHub content repository
- Local JSON storage for simple development users and favorites

## Quick Start

From the workspace root:

```bash
npm install
npm run dev
```

Or from the app folder:

```bash
cd progressive-webapp
npm install
npm run dev
```

Open:

```text
http://localhost:3001
```

Useful commands:

```bash
npm run lint
npm run typecheck
npm run build
npm run start
```

## Environment Setup

Create `.env.local` in `progressive-webapp/`:

```bash
NEXTAUTH_SECRET=change-this-to-a-long-random-secret
NEXTAUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

Google login needs these Google Cloud settings for local development:

```text
Authorized JavaScript origin:
http://localhost:3001

Authorized redirect URI:
http://localhost:3001/api/auth/callback/google
```

`GOOGLE_CLIENT_SECRET` enables the full NextAuth OAuth redirect flow. If only `GOOGLE_CLIENT_ID` is set, the app can still use the browser Google Identity Services fallback.

## What The App Contains

- Landing page: public explanation, signup/login buttons, theme toggle.
- Auth pages: signup, login, Google sign-in.
- Dashboard: authenticated home with search, content status, install button, library/favorites.
- Courses: subject list and markdown topic reader.
- Interview Q&A: question list and markdown answer reader.
- CBT: slideshows, training videos, and audio books.
- PWA/offline: service worker, manifest, cached API content, cached markdown, cached assets.

## Project Structure

| Path | Purpose |
| --- | --- |
| `src/pages/` | App pages and API routes. |
| `src/pages/api/` | Server endpoints for auth, content, favorites, proxy, connectivity. |
| `src/lib/` | Auth, PWA, content loading, cache, offline sync, markdown parsing, helpers. |
| `src/components/content/` | Reusable content UI like ticker, markdown renderer, cached images. |
| `src/context/` | Theme and design config contexts. |
| `src/styles/globals.css` | Global CSS, layout classes, responsive styles. |
| `public/` | Static logos, icons, manifest, generated service worker. |
| `data/users.json` | Local development user storage. |
| `data/favorites.json` | Local development favorite-topic storage. |
| `next.config.js` | Next.js, image, cache header, and PWA build config. |
| `runtime-caching.js` | Workbox runtime caching rules. |
| `scripts/` | Dev/start helper scripts. |

## Where To Change Content

The app reads learning content from the configured GitHub content repository. By default that repository is:

```text
tinitiateprime/tiai-edu-app
branch: main
```

The local workspace also has a sibling folder named `../tiai-edu-app/` that matches the content structure. Editing that local folder is useful for preparing content, but the running app fetches from GitHub unless you push those changes or point the content environment variables to another repo/branch.

### Content Repo Settings

Change the content source with environment variables:

```bash
NEXT_PUBLIC_CONTENT_REPO_OWNER=tinitiateprime
NEXT_PUBLIC_CONTENT_REPO_NAME=tiai-edu-app
NEXT_PUBLIC_CONTENT_REPO_BRANCH=main
NEXT_PUBLIC_CONTENT_REPO_BASE_PATH=
```

Related app file:

```text
src/lib/content-repo-config.ts
```

### Courses

| To change | Edit this file |
| --- | --- |
| Add/remove a course card | `../tiai-edu-app/courses/catalog.yaml` |
| Change course title, category, level, summary | `../tiai-edu-app/courses/catalog.yaml` |
| Change course topics | The course README, for example `../tiai-edu-app/courses/java/README.md` |
| Change a topic page's markdown content | The markdown file linked from that course README |
| Change course icon mapping | `../tiai-edu-app/design/icon.yaml` |
| Add/change icon image files | `../tiai-edu-app/design/course-icons/` |

Course README parsing expects topic headings with markdown links, for example:

```md
## [Introduction](01-introduction.md)
- Bullet shown in search and previews
```

Supported heading levels are `##`, `###`, and `####`.

### Interview Q&A

| To change | Edit this file |
| --- | --- |
| Add/remove interview questions | `../tiai-edu-app/interview-qna/catalog.yaml` |
| Change question title/category/level/tags | `../tiai-edu-app/interview-qna/catalog.yaml` |
| Change the full answer | The `answerPath` markdown file, for example `../tiai-edu-app/interview-qna/questions/design-authentication-service.md` |

### CBT Content

| To change | Edit this file |
| --- | --- |
| Add/remove slideshow decks | `../tiai-edu-app/cbt/slideshows/av-metadata.yaml` |
| Change slideshow markdown | The deck `contentPath`, for example `../tiai-edu-app/cbt/slideshows/decks/react-state-basics/slideshow-content.md` |
| Add/remove training videos | `../tiai-edu-app/cbt/training-videos/av-metadata.yaml` |
| Change training video notes | The item `notesPath` markdown file |
| Add/remove audio books | `../tiai-edu-app/cbt/audio-books/av-metadata.yaml` |
| Change audio notes | The item `notesPath` markdown file |

For videos/audio, use `embedUrl`, `playlistUrl`, `mediaUrl`, or `mediaPath` in the metadata YAML.

### News Ticker

| To change | Edit this file |
| --- | --- |
| Ticker labels, messages, links, order | `../tiai-edu-app/news-ticker/feed.yaml` |

Lower `priority` numbers appear first.

### Colors, Theme, And Design Tokens

| To change | Edit this file |
| --- | --- |
| Light/dark colors | `../tiai-edu-app/design/colour.yaml` |
| Dashboard section colors | `../tiai-edu-app/design/colour.yaml` |
| Course card category colors | `../tiai-edu-app/design/colour.yaml` |
| Landing feature colors | `../tiai-edu-app/design/colour.yaml` |
| Course icons | `../tiai-edu-app/design/icon.yaml` and `../tiai-edu-app/design/course-icons/` |
| CSS layout and responsive behavior | `src/styles/globals.css` |

The app fetches design JSON through `/api/content/design`, stores it in browser storage, and applies it as CSS variables in `src/pages/_app.tsx`.

### Landing Page Text And Company Links

| To change | Edit this file |
| --- | --- |
| Landing headline, feature text, footer links, contact info | `src/pages/index.tsx` |
| App meta description | `src/pages/_app.tsx` and `src/pages/_document.tsx` |
| Browser title/favicon/manifest link setup | `src/pages/_document.tsx` |

### Dashboard And Page UI

| To change | Edit this file |
| --- | --- |
| Dashboard cards/search/library/install UI | `src/pages/dashboard.tsx` |
| Courses list page | `src/pages/courses.tsx` |
| Subject topic list page | `src/pages/subject/[subject].tsx` |
| Topic markdown reader | `src/pages/topic/[topic].tsx` |
| Interview list page | `src/pages/interview/index.tsx` |
| Interview detail page | `src/pages/interview/[slug].tsx` |
| CBT list page | `src/pages/cbt/index.tsx` |
| CBT slideshow reader | `src/pages/cbt/slides/[slug].tsx` |
| CBT media reader | `src/pages/cbt/media/[slug].tsx` |

### Auth, Users, And Favorites

| To change | Edit this file |
| --- | --- |
| NextAuth providers and session callbacks | `src/lib/authOptions.ts` |
| Signup API | `src/pages/api/auth/signup/index.js` |
| Login API | `src/pages/api/auth/login/index.ts` |
| User storage helpers | `src/lib/userStore.ts` |
| Favorite storage helpers | `src/lib/fav.ts` |
| Favorites API | `src/pages/api/favorites.ts` |
| Local users data | `data/users.json` |
| Local favorites data | `data/favorites.json` |

Important: `data/users.json` and `data/favorites.json` are simple local JSON files. They are fine for development/demo use. For production, replace them with a real database.

### PWA, Offline, And Install Behavior

| To change | Edit this file |
| --- | --- |
| App name, start URL, theme color, PWA icons | `public/manifest.json` |
| App logos | `public/TinitiateLogo.png`, `public/TinitiateLogoLight.png`, `public/TinitiateLogoMark.png` |
| App icons | `public/icons/` |
| Service worker registration/cleanup logic | `src/lib/pwa.ts` |
| Offline sync logic | `src/lib/offline-sync.ts` |
| Workbox runtime cache rules | `runtime-caching.js` |
| next-pwa setup | `next.config.js` |

By default, PWA service worker registration is active in production builds. For local dev PWA testing, set:

```bash
NEXT_PUBLIC_ENABLE_PWA_DEV=true
```

Then restart the dev server.

## Content Loading Flow

1. Browser opens a page like `/courses` or `/dashboard`.
2. The page calls helper functions in `src/lib/content-client.ts`.
3. Those helpers call local API routes under `src/pages/api/content/`.
4. API routes call `src/lib/server-content.ts`.
5. `server-content.ts` fetches YAML/markdown from the GitHub content repo.
6. The browser caches API JSON, markdown, and supported assets for offline use.

## Important API Routes

| Route | Purpose |
| --- | --- |
| `/api/content/design` | Design tokens and course icons. |
| `/api/content/ticker` | News ticker items. |
| `/api/content/status` | Latest content repo commit status. |
| `/api/content/courses` | Course subjects and parsed topic lists. |
| `/api/content/interview` | Interview question summaries. |
| `/api/content/interview/[slug]` | One full interview answer. |
| `/api/content/cbt` | CBT slides/videos/audio summaries. |
| `/api/content/slideshows/[slug]` | One slideshow deck. |
| `/api/content/media/[kind]/[slug]` | One video/audio item. |
| `/api/proxy` | Safe proxy for GitHub markdown/assets. |
| `/api/favorites` | Authenticated favorites CRUD. |
| `/api/connectivity` | Connectivity/content reachability check. |

## How To Check The App

1. Run `npm run dev`.
2. Open `http://localhost:3001`.
3. Create an account or login.
4. Confirm the dashboard opens.
5. Check these pages:

```text
/dashboard
/courses
/interview
/cbt
```

6. Open at least one course topic, one interview question, and one CBT item.
7. Run a production check before delivery:

```bash
npm run lint
npm run typecheck
npm run build
```

## Deployment Notes

Set these environment variables in the deployment platform:

```bash
NEXTAUTH_SECRET=your-long-random-secret
NEXTAUTH_URL=https://your-site-domain
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXT_PUBLIC_CONTENT_REPO_OWNER=tinitiateprime
NEXT_PUBLIC_CONTENT_REPO_NAME=tiai-edu-app
NEXT_PUBLIC_CONTENT_REPO_BRANCH=main
```

For Google Cloud, add:

```text
Authorized JavaScript origin:
https://your-site-domain

Authorized redirect URI:
https://your-site-domain/api/auth/callback/google
```

Do not use `http://localhost:3001` for `NEXTAUTH_URL` in production.

## Common Problems

| Problem | Check |
| --- | --- |
| Design config not available | Make sure `design/colour.yaml`, `design/icon.yaml`, and `design/course-icons/*` exist in the content repo. |
| Courses are empty | Check `courses/catalog.yaml` and each course `readmePath`. |
| Topic list is empty | Make sure the course README has `##`, `###`, or `####` headings with `.md` links. |
| Google button is missing | Set `GOOGLE_CLIENT_ID` and restart the app. |
| Google redirect fails | Check `NEXTAUTH_URL` and the Google authorized redirect URI. |
| PWA install button does not show in dev | Use a production build, or set `NEXT_PUBLIC_ENABLE_PWA_DEV=true`. |
| Old offline content appears | Clear site data/service worker in the browser, then reload online. |
