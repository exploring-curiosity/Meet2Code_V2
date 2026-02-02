package com.m2c.app.mongo.repository;

import com.m2c.app.mongo.document.DocumentSnapshot;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface DocumentSnapshotRepository extends MongoRepository<DocumentSnapshot, String> {
}
