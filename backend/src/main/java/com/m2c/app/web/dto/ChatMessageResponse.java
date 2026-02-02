package com.m2c.app.web.dto;

import com.m2c.app.domain.room.RoomMessage;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;

@Value
@Builder
public class ChatMessageResponse {
    String id;
    String authorId;
    String authorUsername;
    String body;
    Instant createdAt;

    public static ChatMessageResponse from(RoomMessage message) {
        return ChatMessageResponse.builder()
                .id(message.getId().toString())
                .authorId(message.getAuthor() != null ? message.getAuthor().getId().toString() : null)
                .authorUsername(message.getAuthor() != null ? message.getAuthor().getUsername() : null)
                .body(message.getBody())
                .createdAt(message.getCreatedAt())
                .build();
    }
}
