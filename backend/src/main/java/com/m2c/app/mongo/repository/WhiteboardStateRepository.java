package com.m2c.app.mongo.repository;

import com.m2c.app.mongo.document.WhiteboardState;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface WhiteboardStateRepository extends MongoRepository<WhiteboardState, String> {
}
