package com.m2c.app.service;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestParticipant;
import com.m2c.app.domain.contest.ContestStatus;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.repository.ContestParticipantRepository;
import com.m2c.app.repository.ContestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ContestService {

    private final ContestRepository contestRepository;
    private final ContestParticipantRepository participantRepository;

    public Contest createContest(String name,
                                 String slug,
                                 OffsetDateTime startTime,
                                 List<String> questions,
                                 UserAccount host) {
        Contest contest = new Contest();
        contest.setName(name);
        contest.setSlug(resolveUniqueSlug(slug));
        contest.setStartTime(startTime);
        contest.setQuestions(questions);
        contest.setHost(host);
        Contest saved = contestRepository.save(contest);

        ContestParticipant participant = new ContestParticipant();
        participant.setContest(saved);
        participant.setUser(host);
        participantRepository.save(participant);

        return saved;
    }

    public Contest joinContest(String slug, UserAccount participant) {
        Contest contest = contestRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Contest not found"));

        Optional<ContestParticipant> existing = participantRepository.findByContestAndUser(contest, participant);
        if (existing.isEmpty()) {
            ContestParticipant contestParticipant = new ContestParticipant();
            contestParticipant.setContest(contest);
            contestParticipant.setUser(participant);
            participantRepository.save(contestParticipant);
        }
        return contest;
    }

    public Contest addScore(String slug, UserAccount user, int increment) {
        Contest contest = contestRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Contest not found"));

        ContestParticipant participant = participantRepository.findByContestAndUser(contest, user)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));

        participant.setScore(participant.getScore() + increment);
        participantRepository.save(participant);
        return contest;
    }

    public Contest getContestsBySlug(String slug) {
        return contestRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Contest not found"));
    }

    public List<Contest> listContests() {
        return contestRepository.findAll();
    }

    public List<ContestParticipant> leaderboard(Contest contest) {
        return participantRepository.findByContestOrderByScoreDesc(contest);
    }

    public List<Contest> readyToStart(OffsetDateTime now) {
        return contestRepository.findByStatusAndStartTimeLessThanEqual(ContestStatus.NOT_STARTED, now);
    }

    public Contest markRunning(Contest contest) {
        contest.setStatus(ContestStatus.RUNNING);
        return contestRepository.save(contest);
}

    private String resolveUniqueSlug(String baseSlug) {
        String candidate = baseSlug;
        int counter = 1;
        while (contestRepository.findBySlug(candidate).isPresent()) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }
}
