package com.m2c.app.web;

import com.m2c.app.mongo.document.DocumentSnapshot;
import com.m2c.app.service.DocumentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

    private final DocumentService documentService;

    @GetMapping("/{id}")
    public ResponseEntity<DocumentSnapshot> getDocument(@PathVariable("id") String id) {
        return ResponseEntity.ok(documentService.findOrCreate(id));
    }

    @PostMapping("/{id}")
    public ResponseEntity<DocumentSnapshot> saveDocument(@PathVariable("id") String id,
                                                          @RequestBody Map<String, Object> data) {
        return ResponseEntity.ok(documentService.save(id, data));
    }
}
