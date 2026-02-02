package com.m2c.app.web;

import com.m2c.app.domain.room.Room;
import com.m2c.app.domain.room.RoomMessage;
import com.m2c.app.domain.room.RoomParticipant;
import com.m2c.app.domain.user.UserAccount;
import com.m2c.app.service.CurrentUserService;
import com.m2c.app.service.RoomService;
import com.m2c.app.service.WhiteboardService;
import com.m2c.app.web.dto.ChatMessageResponse;
import com.m2c.app.web.dto.ParticipantResponse;
import com.m2c.app.web.dto.WhiteboardUpdateRequest;
import com.m2c.app.web.session.SessionUser;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.util.List;
import java.util.Map;

import static com.m2c.app.web.session.SessionUserResolver.SESSION_KEY;

@Controller
@RequiredArgsConstructor
public class RoomWebSocketController {

    private final RoomService roomService;
    private final WhiteboardService whiteboardService;
    private final CurrentUserService currentUserService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/rooms/{slug}/chat")
    public void handleChat(@DestinationVariable("slug") String slug,
                           @jakarta.validation.Valid com.m2c.app.web.dto.ChatMessageRequest request,
                           SimpMessageHeaderAccessor headerAccessor) {
        SessionUser sessionUser = sessionUser(headerAccessor);
        if (sessionUser == null) {
            return;
        }
        UserAccount user = currentUserService.findById(sessionUser.id()).orElse(null);
        if (user == null) {
            return;
        }
        Room room = roomService.getRoom(slug);
        RoomMessage message = roomService.appendMessage(room, user, request.getBody());
        ChatMessageResponse payload = ChatMessageResponse.from(message);
        messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/chat", payload);
    }

    @MessageMapping("/rooms/{slug}/media")
    public void handleMediaUpdate(@DestinationVariable("slug") String slug,
                                  com.m2c.app.web.dto.MediaToggleRequest request,
                                  SimpMessageHeaderAccessor headerAccessor) {
        SessionUser sessionUser = sessionUser(headerAccessor);
        if (sessionUser == null) {
            return;
        }
        UserAccount user = currentUserService.findById(sessionUser.id()).orElse(null);
        if (user == null) {
            return;
        }
        Room room = roomService.getRoom(slug);
        RoomParticipant participant = roomService.updateMediaStatus(room, user, request.getAudioEnabled(), request.getVideoEnabled());
        ParticipantResponse response = ParticipantResponse.from(participant);
        messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/participants", response);
    }

    @MessageMapping("/rooms/{slug}/whiteboard")
    public void whiteboard(@DestinationVariable("slug") String slug,
                           @jakarta.validation.Valid WhiteboardUpdateRequest request,
                           SimpMessageHeaderAccessor headerAccessor) {
        SessionUser sessionUser = sessionUser(headerAccessor);
        String updatedBy = sessionUser != null ? sessionUser.username() : "anonymous";
        var saved = whiteboardService.saveState(slug, request.imageData());
        messagingTemplate.convertAndSend("/topic/rooms/" + slug + "/whiteboard", Map.of(
                "imageData", request.imageData(),
                "updatedBy", updatedBy,
                "updatedAtMs", saved.getUpdatedAt().toEpochMilli()
        ));
    }

    private SessionUser sessionUser(SimpMessageHeaderAccessor accessor) {
        if (accessor.getSessionAttributes() == null) {
            return null;
        }
        Object value = accessor.getSessionAttributes().get(SESSION_KEY);
        return value instanceof SessionUser sessionUser ? sessionUser : null;
    }
}
