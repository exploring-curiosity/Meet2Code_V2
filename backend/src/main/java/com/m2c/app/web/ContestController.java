package com.m2c.app.web;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestParticipant;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.service.ContestService;
import com.m2c.app.service.CurrentUserService;
import com.m2c.app.util.SlugGenerator;
import com.m2c.app.web.dto.AddScoreRequest;
import com.m2c.app.web.dto.ContestResponse;
import com.m2c.app.web.dto.CreateContestRequest;
import com.m2c.app.web.session.SessionUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/contests")
@RequiredArgsConstructor
public class ContestController {

    private final ContestService contestService;
    private final CurrentUserService currentUserService;

    @GetMapping
    public List<ContestResponse> contests() {
        return contestService.listContests().stream()
                .map(contest -> ContestResponse.from(contest, contestService.leaderboard(contest)))
                .collect(Collectors.toList());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ContestResponse> contest(@PathVariable String slug) {
        Contest contest = contestService.getContestsBySlug(slug);
        List<ContestParticipant> leaderboard = contestService.leaderboard(contest);
        return ResponseEntity.ok(ContestResponse.from(contest, leaderboard));
    }

    @GetMapping("/{slug}/leaderboard")
    public ResponseEntity<List<ContestResponse.ParticipantScore>> leaderboard(@PathVariable String slug) {
        Contest contest = contestService.getContestsBySlug(slug);
        List<ContestParticipant> leaderboard = contestService.leaderboard(contest);
        List<ContestResponse.ParticipantScore> payload = leaderboard.stream()
                .map(participant -> ContestResponse.ParticipantScore.builder()
                        .userId(participant.getUser().getId().toString())
                        .username(participant.getUser().getUsername())
                        .score(participant.getScore())
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(payload);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<ContestResponse> createContest(@Valid @RequestBody CreateContestRequest request,
                                                         SessionUser sessionUser) {
        UserAccount host = resolve(sessionUser);
        if (host == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        String slugBase = SlugGenerator.fromText(request.getName());
        if (!org.springframework.util.StringUtils.hasText(slugBase)) {
            slugBase = SlugGenerator.random();
        }

        Contest contest = contestService.createContest(
                request.getName(),
                slugBase,
                request.getStartTime() != null ? request.getStartTime() : java.time.OffsetDateTime.now().plusMinutes(1),
                request.getQuestions(),
                host
        );
        List<ContestParticipant> leaderboard = contestService.leaderboard(contest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ContestResponse.from(contest, leaderboard));
    }

    @PostMapping("/{slug}/join")
    @Transactional
    public ResponseEntity<ContestResponse> joinContest(@PathVariable String slug,
                                                       SessionUser sessionUser) {
        UserAccount user = resolve(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        Contest contest = contestService.joinContest(slug, user);
        return ResponseEntity.ok(ContestResponse.from(contest, contestService.leaderboard(contest)));
    }

    @PostMapping("/{slug}/score")
    @Transactional
    public ResponseEntity<Void> addScore(@PathVariable String slug,
                                         @Valid @RequestBody AddScoreRequest request,
                                         SessionUser sessionUser) {
        UserAccount user = resolve(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        int increment = request.getProblemNumber() * 10;
        contestService.addScore(slug, user, increment);
        return ResponseEntity.ok().build();
    }

    private UserAccount resolve(SessionUser sessionUser) {
        if (sessionUser == null) {
            return null;
        }
        return currentUserService.findById(sessionUser.id()).orElse(null);
    }
}
