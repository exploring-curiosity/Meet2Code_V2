package com.m2c.app.service;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomMessage;
import com.m2c.app.domain.room.RoomParticipant;
import com.m2c.app.domain.room.RoomType;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.repository.RoomMessageRepository;
import com.m2c.app.repository.RoomParticipantRepository;
import com.m2c.app.repository.RoomRepository;
import com.m2c.app.util.SlugGenerator;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class RoomService {

    private final RoomRepository roomRepository;
    private final RoomParticipantRepository participantRepository;
    private final RoomMessageRepository messageRepository;
    private final PasswordEncoder passwordEncoder;

    public Room createRoom(String name,
                           String description,
                           RoomType type,
                           String password,
                           UserAccount host) {
        Room room = new Room();
        room.setName(name);
        room.setDescription(description);
        room.setType(type == null ? RoomType.PUBLIC : type);
        room.setHost(host);

        if (StringUtils.hasText(password)) {
            room.setPasswordHash(passwordEncoder.encode(password));
        }

        String slug = SlugGenerator.fromText(name);
        if (!StringUtils.hasText(slug)) {
            slug = SlugGenerator.random();
        }
        room.setSlug(resolveUniqueSlug(slug));

        Room saved = roomRepository.save(room);

        RoomParticipant hostParticipant = new RoomParticipant();
        hostParticipant.setRoom(saved);
        hostParticipant.setUser(host);
        participantRepository.save(hostParticipant);

        return saved;
    }

    public RoomParticipant joinRoom(String slug, UserAccount user, String password) {
        Room room = roomRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));

        if (room.getType() == RoomType.PRIVATE) {
            if (!StringUtils.hasText(password) || !passwordMatches(room, password)) {
                throw new IllegalArgumentException("Invalid room password");
            }
        }

        Optional<RoomParticipant> existing = participantRepository.findByRoomAndUser(room, user);
        if (existing.isEmpty()) {
            RoomParticipant participant = new RoomParticipant();
            participant.setRoom(room);
            participant.setUser(user);
            return participantRepository.save(participant);
        }
        return existing.get();
    }

    public boolean leaveRoom(String slug, UserAccount user) {
        Room room = roomRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));

        // Remove participant
        participantRepository.findByRoomAndUser(room, user)
                .ifPresent(participantRepository::delete);

        // Room continues even if host leaves
        return true;
    }

    public void deleteRoom(String slug, UserAccount user) {
        Room room = roomRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));

        // Only host can delete the room
        if (!room.getHost().getId().equals(user.getId())) {
            throw new IllegalStateException("Only the host can delete the room");
        }

        // Delete all related data
        messageRepository.deleteByRoom(room);
        participantRepository.findByRoom(room).forEach(participantRepository::delete);
        roomRepository.delete(room);
    }

    public List<Room> listPublicRooms() {
        return roomRepository.findByTypeOrderByCreatedAtDesc(RoomType.PUBLIC);
    }

    public Room getRoom(String slug) {
        return roomRepository.findBySlug(slug)
                .orElseThrow(() -> new EntityNotFoundException("Room not found"));
    }

    public List<RoomParticipant> participants(Room room) {
        return participantRepository.findByRoom(room);
    }

    public long participantCount(Room room) {
        return participantRepository.countByRoom(room);
    }

    public List<RoomMessage> recentMessages(Room room) {
        return messageRepository.findTop50ByRoomOrderByCreatedAtDesc(room);
    }

    public RoomMessage appendMessage(Room room, UserAccount user, String body) {
        RoomMessage message = new RoomMessage();
        message.setRoom(room);
        message.setAuthor(user);
        message.setBody(body);
        return messageRepository.save(message);
    }

    public RoomParticipant updateMediaStatus(Room room, UserAccount user, Boolean audio, Boolean video) {
        RoomParticipant participant = participantRepository.findByRoomAndUser(room, user)
                .orElseThrow(() -> new EntityNotFoundException("Participant not found"));

        if (audio != null) {
            participant.setAudioEnabled(audio);
        }
        if (video != null) {
            participant.setVideoEnabled(video);
        }
        return participantRepository.save(participant);
    }

    private boolean passwordMatches(Room room, String rawPassword) {
        if (!StringUtils.hasText(room.getPasswordHash())) {
            return true;
        }
        return passwordEncoder.matches(rawPassword, room.getPasswordHash());
    }

    private String resolveUniqueSlug(String baseSlug) {
        String candidate = baseSlug;
        int counter = 1;
        while (roomRepository.findBySlug(candidate).isPresent()) {
            candidate = baseSlug + "-" + counter++;
        }
        return candidate;
    }
}
