package com.m2c.app.web;

import com.m2c.app.service.QuestionService;
import com.m2c.app.web.dto.RunTestsRequest;
import com.m2c.app.web.dto.RunTestsResponse;
import com.m2c.app.web.dto.SaveTestCasesRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;

import java.util.Map;

@RestController
@RequestMapping("/api/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionService questionService;

    @GetMapping("/testcases")
    public ResponseEntity<?> testcases(@RequestParam("contestId") String contestId,
                                       @RequestParam("questionId") String questionId) {
        return questionService.findTestCases(contestId, questionId)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(Map.of("testCases", java.util.List.of())));
    }

    @PostMapping("/testcases")
    public ResponseEntity<?> saveTestcases(@Valid @RequestBody SaveTestCasesRequest request) {
        return ResponseEntity.ok(
                questionService.saveTestCases(request.contestId(), request.questionId(), request.testCases())
        );
    }

    @PostMapping("/run-tests")
    public ResponseEntity<RunTestsResponse> runTests(@Valid @RequestBody RunTestsRequest request) {
        return ResponseEntity.ok(
                questionService.runTests(request.code(), request.language(), request.testCases())
        );
    }
}
