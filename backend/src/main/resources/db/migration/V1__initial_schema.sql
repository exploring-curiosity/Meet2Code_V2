-- Flyway baseline migration for Meet2Code v2 relational data model
-- Generated during Spring Boot migration from the Node/Express backend.

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    username VARCHAR(180) NOT NULL,
    display_name VARCHAR(180),
    avatar_url TEXT,
    provider VARCHAR(32) NOT NULL,
    external_id VARCHAR(190) NOT NULL,
    github_access_token TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_users_external UNIQUE (provider, external_id)
);

CREATE TABLE IF NOT EXISTS rooms (
    id UUID PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    description TEXT,
    type VARCHAR(16) NOT NULL,
    password_hash VARCHAR(255),
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_rooms_slug UNIQUE (slug)
);

CREATE TABLE IF NOT EXISTS room_participants (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    audio_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    video_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT uk_room_participant UNIQUE (room_id, user_id)
);

CREATE TABLE IF NOT EXISTS room_messages (
    id UUID PRIMARY KEY,
    room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    slug VARCHAR(64) NOT NULL,
    start_time TIMESTAMPTZ NOT NULL,
    status VARCHAR(16) NOT NULL,
    host_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_contests_slug UNIQUE (slug),
    CONSTRAINT uk_contests_name UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS contest_questions (
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    question_ref TEXT,
    PRIMARY KEY (contest_id, position)
);

CREATE TABLE IF NOT EXISTS contest_participants (
    id UUID PRIMARY KEY,
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uk_contest_participant UNIQUE (contest_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_rooms_host ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_room_messages_room ON room_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_contest_participants_contest ON contest_participants(contest_id);
