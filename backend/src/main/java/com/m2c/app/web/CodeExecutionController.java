package com.m2c.app.web;

import com.m2c.app.service.CodeExecutionService;
import com.m2c.app.web.dto.CodeExecutionRequest;
import com.m2c.app.web.dto.CodeExecutionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/execute")
@RequiredArgsConstructor
public class CodeExecutionController {

    private final CodeExecutionService codeExecutionService;

    @PostMapping
    public ResponseEntity<CodeExecutionResponse> executeCode(@Valid @RequestBody CodeExecutionRequest request) {
        CodeExecutionService.ExecutionResult result = codeExecutionService.executeCode(
                request.code(),
                request.language(),
                request.input() != null ? request.input() : ""
        );

        CodeExecutionResponse response = new CodeExecutionResponse(
                result.success(),
                result.output(),
                result.error(),
                result.executionTimeMs()
        );

        return ResponseEntity.ok(response);
    }
}
