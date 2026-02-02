package com.m2c.app.service;

import com.m2c.app.mongo.document.WhiteboardState;
import com.m2c.app.mongo.repository.WhiteboardStateRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class WhiteboardService {

    private final WhiteboardStateRepository whiteboardStateRepository;

    public WhiteboardState saveState(String roomId, String imageData) {
        WhiteboardState state = whiteboardStateRepository.findById(roomId)
                .orElseGet(() -> {
                    WhiteboardState whiteboardState = new WhiteboardState();
                    whiteboardState.setRoomId(roomId);
                    return whiteboardState;
                });
        state.setImageData(imageData);
        state.setUpdatedAt(java.time.Instant.now());
        return whiteboardStateRepository.save(state);
    }

    public Optional<WhiteboardState> fetchState(String roomId) {
        return whiteboardStateRepository.findById(roomId);
    }
}
