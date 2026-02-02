package com.m2c.app.service;

import com.m2c.app.mongo.document.DocumentSnapshot;
import com.m2c.app.mongo.repository.DocumentSnapshotRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class DocumentService {

    private final DocumentSnapshotRepository repository;

    public DocumentSnapshot findOrCreate(String id) {
        return repository.findById(id)
                .orElseGet(() -> {
                    DocumentSnapshot snapshot = new DocumentSnapshot();
                    snapshot.setId(id);
                    snapshot.setData(new HashMap<>());
                    return repository.save(snapshot);
                });
    }

    public DocumentSnapshot save(String id, Map<String, Object> data) {
        DocumentSnapshot snapshot = repository.findById(id)
                .orElseGet(() -> {
                    DocumentSnapshot doc = new DocumentSnapshot();
                    doc.setId(id);
                    return doc;
                });
        snapshot.setData(data);
        snapshot.setUpdatedAt(java.time.Instant.now());
        return repository.save(snapshot);
    }
}
