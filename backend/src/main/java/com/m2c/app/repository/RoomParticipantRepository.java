package com.m2c.app.repository;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomParticipant;
import com.m2c.app.domain.user.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, UUID> {

    @Query("SELECT p FROM RoomParticipant p JOIN FETCH p.user WHERE p.room = :room")
    List<RoomParticipant> findByRoom(@Param("room") Room room);

    @Query("SELECT p FROM RoomParticipant p JOIN FETCH p.user WHERE p.room = :room AND p.user = :user")
    Optional<RoomParticipant> findByRoomAndUser(@Param("room") Room room, @Param("user") UserAccount user);

    long countByRoom(Room room);
}
