# Meet2Code v2 Monorepo Skeleton

This directory contains the next-generation Meet2Code stack. Each service lives in its own sub-folder and can be developed or deployed independently.

## Structure
- `backend/` – Spring Boot 3 API with PostgreSQL + MongoDB persistence.
- `frontend/` – Next.js 14 React frontend with TailwindCSS styling.
- `yjs-server/` – Node.js + Express real-time synchronization server (y-websocket).
- `peer-server/` – Go-based WebRTC signaling server using Gin + Gorilla WebSocket.

## Local Bootstrap Checklist
1. **Backend**
   - Install Java 17+ and Maven.
   - `cd backend` and create a `.env` file with the Spring Boot variables described in `backend/README.md`.
   - `mvn spring-boot:run`.
2. **Frontend**
   - `cd frontend && npm install`.
   - Create `.env.local` with the public URLs and OAuth client IDs needed by Next.js.
   - `npm run dev`.
3. **Yjs Server**
   - `cd yjs-server && npm install`.
   - Optionally create `.env` to override the default port/path.
   - `npm run dev`.
4. **Peer Signaling Server**
   - `cd peer-server` and optionally create `.env` (e.g. to change `PORT`).
   - `go run ./cmd/server` or `make run`.

## Networking
| Service | Default Port | Protocol |
|---------|--------------|----------|
| Spring Boot API | 9000 | HTTP |
| Next.js frontend | 3000 | HTTP |
| Yjs server | 1234 | HTTP + WebSocket (path `/yjs`) |
| Peer signaling | 8080 | HTTP + WebSocket (`/ws/:room`) |

## Next Steps
- Extend the WebRTC peer server integration to drive live media streams inside `/rooms/[slug]`.
- Migrate historical MongoDB/Yjs data into the new structure and backfill test cases.
- Containerize each service and introduce CI/CD pipelines for coordinated deployments.
