package com.m2c.app.web.dto;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomType;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class RoomSummaryResponse {
    String slug;
    String name;
    String description;
    RoomType type;
    int participantCount;
    Instant createdAt;
    Host host;

    @Value
    @Builder
    public static class Host {
        String username;
        String displayName;
        String avatarUrl;
    }

    public static RoomSummaryResponse from(Room room, int participantCount) {
        return RoomSummaryResponse.builder()
                .slug(room.getSlug())
                .name(room.getName())
                .description(room.getDescription())
                .type(room.getType())
                .participantCount(participantCount)
                .createdAt(room.getCreatedAt())
                .host(Host.builder()
                        .username(room.getHost().getUsername())
                        .displayName(room.getHost().getDisplayName())
                        .avatarUrl(room.getHost().getAvatarUrl())
                        .build())
                .build();
    }
}
