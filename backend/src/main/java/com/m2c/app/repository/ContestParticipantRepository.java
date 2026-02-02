package com.m2c.app.repository;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestParticipant;
import com.m2c.app.domain.user.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContestParticipantRepository extends JpaRepository<ContestParticipant, UUID> {

    List<ContestParticipant> findByContestOrderByScoreDesc(Contest contest);

    Optional<ContestParticipant> findByContestAndUser(Contest contest, UserAccount user);
}
