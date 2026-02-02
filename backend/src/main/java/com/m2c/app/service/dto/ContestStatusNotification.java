package com.m2c.app.service.dto;

import com.m2c.app.domain.contest.ContestStatus;
import java.time.OffsetDateTime;

public record ContestStatusNotification(String slug, String name, ContestStatus status, OffsetDateTime startTime) {
}
