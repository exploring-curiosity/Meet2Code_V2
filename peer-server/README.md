# Meet2Code Peer Signaling Server (Go + Gin)

## Overview
This Go service coordinates WebRTC peer discovery and relays metadata between participants using WebSockets. It replaces the legacy PeerJS node server with a lightweight Gin + Gorilla WebSocket stack.

### Features
- `/health` endpoint exposes liveness data and room occupancy.
- `/ws/:room` WebSocket endpoint for room-based signaling.
- Broadcast-only hub implementation keeps the surface area simple during the rewrite phase.

## Requirements
- Go 1.22+

## Getting Started
```bash
# optionally create a local .env to override defaults
go run ./cmd/server # or make run
```

By default the server listens on `:8080`. Tweak this through the `PORT` environment variable.

### WebSocket contract
Clients should connect to `ws://<host>:<port>/ws/<room>?clientId=<uuid>`.

Messages are JSON encoded and fan out to the rest of the room:

| Type | Payload | Purpose |
|------|---------|---------|
| `{"type":"introduce","clientId":<id>,"responded":?}` | announce a participant. Receivers create/deduplicate WebRTC peers and optionally respond with their own `introduce`. |
| `{"type":"signal","from":<id>,"to":<id>,"signal":<SimplePeer data>}` | carries SDP offers/answers and ICE candidates between peers. |
| `{"type":"leave","clientId":<id>}` | broadcast when a client disconnects so others can tear down their peer connections. |

The Next.js frontend uses these primitives with `simple-peer` to negotiate WebRTC streams without any additional server-side state.

## Next Steps
- Persist peer metadata to Redis/Postgres for durability across restarts.
- Enforce origin checks and API keys before production rollout.
- Add structured logging + metrics exporters (Prometheus, OpenTelemetry).
