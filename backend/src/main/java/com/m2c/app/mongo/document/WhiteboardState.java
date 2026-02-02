package com.m2c.app.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "whiteboards")
public class WhiteboardState {

    @Id
    private String roomId;

    private String imageData;

    private Instant updatedAt = Instant.now();
}
