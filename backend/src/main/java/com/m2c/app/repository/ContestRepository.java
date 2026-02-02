package com.m2c.app.repository;

import com.m2c.app.domain.contest.Contest;
import com.m2c.app.domain.contest.ContestStatus;
import com.m2c.app.domain.user.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ContestRepository extends JpaRepository<Contest, UUID> {

    Optional<Contest> findBySlug(String slug);

    List<Contest> findByStatusOrderByStartTimeAsc(ContestStatus status);

    List<Contest> findByHost(UserAccount host);

    List<Contest> findByStatusAndStartTimeLessThanEqual(ContestStatus status, OffsetDateTime startTime);
}
