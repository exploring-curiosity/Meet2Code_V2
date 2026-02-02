package com.m2c.app.repository;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomMessage;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RoomMessageRepository extends JpaRepository<RoomMessage, UUID> {

    @EntityGraph(attributePaths = "author")
    List<RoomMessage> findTop50ByRoomOrderByCreatedAtDesc(Room room);

    void deleteByRoom(Room room);
}
