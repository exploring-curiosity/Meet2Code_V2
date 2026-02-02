# Meet2Code Backend (Spring Boot)

## Overview
This module re-imagines the Meet2Code backend on top of Spring Boot 3. It ships with:
- REST API starter (`HealthController`) to verify service health
- Dual persistence strategy that blends PostgreSQL (relational) and MongoDB (document) stores
- SpringDoc OpenAPI integration for auto-generated API docs

## Requirements
- Java 17+
- Maven 3.9+
- PostgreSQL 14+ (create database `m2c` or point `POSTGRES_URL` to another DB)
- MongoDB 6+ (create database `m2c` or update `MONGODB_URI`)

```sql
-- Postgres bootstrap (from psql)
CREATE DATABASE m2c;

-- Mongo bootstrap (from mongosh)
use m2c;
```

## Getting Started
1. Create a `.env` file in the backend directory (not checked into git) and populate the variables documented below.
2. Export configuration values (see the Environment section) if you prefer using your shell instead of `.env`.
3. Ensure Flyway can reach the intended Postgres database (the first run applies `db/migration/V1__initial_schema.sql`).
4. Run the service:
    ```bash
    mvn spring-boot:run
    ```
5. Open http://localhost:9000/api/health to verify the API is up.

## Feature highlights
- **OAuth**: `/api/oauth/google`, `/api/oauth/github/callback`, `/api/oauth/isloggedin`, `/api/oauth/github/repos` mirror the legacy authentication flow while storing session context in HttpSession.
- **Rooms**: `/api/rooms` (create), `/api/rooms/public`, `/api/rooms/{slug}` and `/api/rooms/{slug}/join|leave` manage collaborative rooms backed by PostgreSQL. A STOMP broker at `/ws` replicates chat, media toggles, and whiteboard updates on `/topic/rooms/{slug}/*`.
- **Contests**: `/api/contests` CRUD endpoints with scheduled status flips and live notifications on `/topic/contests/{slug}`.
- **LeetCode integration**: `/api/leetcode/questions` and `/api/leetcode/problem/details` proxy the GraphQL API with Caffeine caching.
- **Documents & Whiteboard**: `/api/documents/{id}` and `/api/whiteboard/{roomId}` interact with MongoDB snapshots that complement the upgraded Yjs server.

## Environment
All sensitive data is externalised. Supply the following variables via your shell, `.env`, or the process manager you use:

| Variable | Purpose |
|----------|---------|
| `POSTGRES_URL` | JDBC URL for the relational database (default `jdbc:postgresql://localhost:5432/m2c`). |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` | Database credentials. |
| `MONGODB_URI` | MongoDB connection string (default `mongodb://localhost:27017/m2c`). |
| `SESSION_SECRET` | Secret for signing server-side sessions. |
| `SESSION_COOKIE_NAME` | Cookie name for the session (default `meet2codeSession`). |
| `M2C_GIT_CLIENT_ID` / `M2C_GIT_CLIENT_SECRET` | OAuth credentials carried over from the legacy app. |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID carried over from the legacy app (secret not required for token verification flow). |
| `ALLOWED_ORIGINS` | Comma-separated list of origins permitted for CORS (default `http://localhost:3000`). |

Add additional secrets (Slack webhooks, Twilio tokens, etc.) here as they get ported from the original Node backend.

## Next Steps
- Model JPA entities/services for rooms, contests, collaborative resources.
- Mirror collaborative artifacts in Mongo collections.
- Introduce authentication (Spring Security + OAuth/OIDC) backed by the existing OAuth credentials.
- Replace the placeholder Flyway migration with real schema once domain design is finalised.
