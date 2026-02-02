# Meet2Code Frontend (Next.js)

## Overview
This module houses the Next.js 14 frontend for the revamped Meet2Code experience. It is set up with:
- App Router structure (`app/` directory)
- TailwindCSS styling
- Typescript-first tooling
- Service endpoint awareness for the Spring Boot API, Yjs WebSocket server, and Go peer server
- STOMP integration for room chat/presence and contest notifications

## Requirements
- Node.js 18.17+
- npm 9+ (or pnpm / yarn)

## Getting Started
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env.local` file:
   ```bash
   touch .env.local
   ```
3. Populate `.env.local` with the variables below, pointing at your running services.
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Visit http://localhost:3000 to view the landing page.

## Environment Variables
Define the following in `.env.local` (values shown are typical defaults):

```
NEXT_PUBLIC_BACKEND_URL=http://localhost:9000
NEXT_PUBLIC_YJS_URL=ws://localhost:1234/yjs
NEXT_PUBLIC_PEER_URL=http://localhost:8080/ws
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<google-client-id>
NEXT_PUBLIC_GITHUB_CLIENT_ID=<github-client-id>
```

## Key routes
- `/login` – GitHub/Google authentication using the new Spring Boot OAuth endpoints.
- `/rooms` – list public rooms, create new rooms, and join sessions with WebSocket chat + presence.
- `/rooms/[slug]` – in-room dashboard with chat, whiteboard snapshots, and participant roster.
- `/contests` & `/contests/[slug]` – contest overview with live score updates.
- LeetCode problem picker lives inside `/rooms/[slug]` for full statements and sample tests.

## Next Steps
- Port authentication flows into NextAuth or custom middleware.
- Implement collaborative workspaces using WebRTC + WebSocket clients.
- Add telemetry and error boundaries before production rollout.
