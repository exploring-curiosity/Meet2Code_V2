package com.m2c.app.service;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestStatus;
import com.m2c.app.service.dto.ContestStatusNotification;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ContestScheduler {

    private final ContestService contestService;
    private final SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedDelay = 30000)
    public void monitorContests() {
        OffsetDateTime now = OffsetDateTime.now();
        List<Contest> contests = contestService.readyToStart(now);
        contests.forEach(contest -> {
            contestService.markRunning(contest);
            ContestStatusNotification notification = new ContestStatusNotification(
                    contest.getSlug(),
                    contest.getName(),
                    ContestStatus.RUNNING,
                    contest.getStartTime()
            );
            messagingTemplate.convertAndSend("/topic/contests/" + contest.getSlug(), notification);
        });
    }
}
