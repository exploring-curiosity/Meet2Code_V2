package com.m2c.app.web.dto;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomParticipant;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.List;
import java.util.stream.Collectors;

@Value
@Builder
public class RoomDetailResponse {
    String slug;
    String name;
    String description;
    String hostId;
    String type;
    boolean passwordProtected;
    Instant createdAt;
    List<ParticipantResponse> participants;

    public static RoomDetailResponse from(Room room, List<RoomParticipant> participants) {
        return RoomDetailResponse.builder()
                .slug(room.getSlug())
                .name(room.getName())
                .description(room.getDescription())
                .hostId(room.getHost().getId().toString())
                .type(room.getType().name())
                .passwordProtected(room.getPasswordHash() != null)
                .createdAt(room.getCreatedAt())
                .participants(participants.stream()
                        .map(ParticipantResponse::from)
                        .collect(Collectors.toList()))
                .build();
    }
}
