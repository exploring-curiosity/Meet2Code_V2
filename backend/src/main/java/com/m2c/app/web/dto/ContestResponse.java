package com.m2c.app.web.dto;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestParticipant;
import com.m2c.app.domain.contest.ContestStatus;
import lombok.Builder;
import lombok.Value;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Value
@Builder
public class ContestResponse {
    String slug;
    String name;
    ContestStatus status;
    OffsetDateTime startTime;
    List<String> questions;
    Host host;
    List<ParticipantScore> participants;

    @Value
    @Builder
    public static class Host {
        String id;
        String username;
        String displayName;
        String avatarUrl;
    }

    @Value
    @Builder
    public static class ParticipantScore {
        String userId;
        String username;
        int score;
    }

    public static ContestResponse from(Contest contest, List<ContestParticipant> participants) {
        return ContestResponse.builder()
                .slug(contest.getSlug())
                .name(contest.getName())
                .status(contest.getStatus())
                .startTime(contest.getStartTime())
                .questions(contest.getQuestions())
                .host(Host.builder()
                        .id(contest.getHost().getId().toString())
                        .username(contest.getHost().getUsername())
                        .displayName(contest.getHost().getDisplayName())
                        .avatarUrl(contest.getHost().getAvatarUrl())
                        .build())
                .participants(participants.stream()
                        .map(participant -> ParticipantScore.builder()
                                .userId(participant.getUser().getId().toString())
                                .username(participant.getUser().getUsername())
                                .score(participant.getScore())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }
}
