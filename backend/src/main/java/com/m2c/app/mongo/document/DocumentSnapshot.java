package com.m2c.app.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "documents")
public class DocumentSnapshot {

    @Id
    private String id;

    private Map<String, Object> data;

    private Instant updatedAt = Instant.now();
}
