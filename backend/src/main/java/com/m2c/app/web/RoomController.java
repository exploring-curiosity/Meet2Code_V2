package com.m2c.app.web;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomParticipant;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.service.CurrentUserService;
import com.m2c.app.service.RoomService;
import com.m2c.app.web.dto.ChatMessageResponse;
import com.m2c.app.web.dto.CreateRoomRequest;
import com.m2c.app.web.dto.JoinRoomRequest;
import com.m2c.app.web.dto.ParticipantResponse;
import com.m2c.app.web.dto.RoomDetailResponse;
import com.m2c.app.web.dto.RoomSummaryResponse;
import com.m2c.app.web.session.SessionUser;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
public class RoomController {

    private final RoomService roomService;
    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;

    @GetMapping("/public")
    public List<RoomSummaryResponse> publicRooms() {
        return roomService.listPublicRooms().stream()
                .map(room -> RoomSummaryResponse.from(room, (int) roomService.participantCount(room)))
                .collect(Collectors.toList());
    }

    @GetMapping("/{slug}")
    public ResponseEntity<RoomDetailResponse> roomDetails(@PathVariable("slug") String slug) {
        Room room = roomService.getRoom(slug);
        List<RoomParticipant> participants = roomService.participants(room);
        return ResponseEntity.ok(RoomDetailResponse.from(room, participants));
    }

    @GetMapping("/{slug}/messages")
    public ResponseEntity<List<ChatMessageResponse>> roomMessages(@PathVariable("slug") String slug) {
        Room room = roomService.getRoom(slug);
        List<com.m2c.app.domain.room.RoomMessage> history = roomService.recentMessages(room);
        Collections.reverse(history);
        List<ChatMessageResponse> messages = history.stream()
                .map(ChatMessageResponse::from)
                .collect(Collectors.toList());
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<RoomDetailResponse> createRoom(@Valid @RequestBody CreateRoomRequest request,
                                                         SessionUser sessionUser,
                                                         HttpServletRequest httpRequest) {
        UserAccount user = resolveUser(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        Room room = roomService.createRoom(
                request.getName(),
                request.getDescription(),
                request.getType(),
                request.getPassword(),
                user
        );
        List<RoomParticipant> participants = roomService.participants(room);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(RoomDetailResponse.from(room, participants));
    }

    @PostMapping("/{slug}/join")
    @Transactional
    public ResponseEntity<RoomDetailResponse> joinRoom(@PathVariable("slug") String slug,
                                                       @Valid @RequestBody JoinRoomRequest joinRequest,
                                                       SessionUser sessionUser) {
        UserAccount user = resolveUser(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        RoomParticipant participant = roomService.joinRoom(slug, user, joinRequest.getPassword());
        Room room = participant.getRoom();
        messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/participants", ParticipantResponse.from(participant));
        List<RoomParticipant> participants = roomService.participants(room);
        return ResponseEntity.ok(RoomDetailResponse.from(room, participants));
    }

    @PostMapping("/{slug}/leave")
    @Transactional
    public ResponseEntity<Void> leaveRoom(@PathVariable("slug") String slug,
                                          SessionUser sessionUser) {
        UserAccount user = resolveUser(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        roomService.leaveRoom(slug, user);
        messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/participants",
                java.util.Map.of(
                        "event", "LEFT",
                        "userId", user.getId().toString()
                ));
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{slug}")
    @Transactional
    public ResponseEntity<Void> deleteRoom(@PathVariable("slug") String slug,
                                           SessionUser sessionUser) {
        UserAccount user = resolveUser(sessionUser);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            roomService.deleteRoom(slug, user);
            messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/participants",
                    java.util.Map.of("event", "ROOM_DELETED"));
            return ResponseEntity.ok().build();
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    private UserAccount resolveUser(SessionUser sessionUser) {
        if (sessionUser == null) {
            return null;
        }
        return currentUserService.findById(sessionUser.id()).orElse(null);
    }
}
