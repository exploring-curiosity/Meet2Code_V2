package com.m2c.app.web.dto;

import com.m2c.app.domain.room.RoomParticipant;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class ParticipantResponse {
    String userId;
    String username;
    String displayName;
    String avatarUrl;
    boolean audioEnabled;
    boolean videoEnabled;

    public static ParticipantResponse from(RoomParticipant participant) {
        return ParticipantResponse.builder()
                .userId(participant.getUser().getId().toString())
                .username(participant.getUser().getUsername())
                .displayName(participant.getUser().getDisplayName())
                .avatarUrl(participant.getUser().getAvatarUrl())
                .audioEnabled(participant.isAudioEnabled())
                .videoEnabled(participant.isVideoEnabled())
                .build();
    }
}
