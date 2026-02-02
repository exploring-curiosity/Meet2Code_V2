# Meet2Code Yjs Collaboration Server

## Overview
A modern Node.js + Express wrapper around the `y-websocket` server used to synchronize collaborative editors and whiteboards.

### Features
- HTTP health endpoint at `/health`
- Configurable WebSocket path (defaults to `/yjs`)
- Room selection through either the path segment or `?room=` query parameter
- Garbage collection toggle via `?gc=false`

## Requirements
- Node.js 18+
- npm 9+

## Development
```bash
npm install
# optionally create a local .env to override defaults
npm run dev
```
The dev task runs `nodemon` with `ts-node` for live reloads.

## Production Build
```bash
npm run build
npm start
```

## Environment Variables
Define these keys in a local `.env` file if you need to override defaults:
- `PORT` – HTTP/WebSocket server port (default `1234`)
- `WS_PATH` – Path prefix for WebSocket upgrades (default `/yjs`)
