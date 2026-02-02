package com.m2c.app.repository;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.user.UserAccount;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomRepository extends JpaRepository<Room, UUID> {

    Optional<Room> findBySlug(String slug);

    @EntityGraph(attributePaths = {"host"})
    List<Room> findByTypeOrderByCreatedAtDesc(com.m2c.app.domain.room.RoomType type);

    long countByHost(UserAccount host);
}
