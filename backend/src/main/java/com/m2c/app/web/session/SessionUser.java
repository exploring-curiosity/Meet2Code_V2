package com.m2c.app.web.session;

import java.io.Serializable;
import java.util.UUID;

public record SessionUser(UUID id, String username, String displayName, String avatarUrl) implements Serializable {
}
