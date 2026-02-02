package com.m2c.app.web.dto;

import java.util.List;
import java.util.Map;

public record ProblemResponse(
        int contestId,
        String index,
        String title,
        String timeLimit,
        String memoryLimit,
        String statement,
        List<TestCase> sampleTests
) {
    public record TestCase(String input, String output) {}
    
    @SuppressWarnings("unchecked")
    public static ProblemResponse from(Map<String, Object> data) {
        List<Map<String, String>> tests = (List<Map<String, String>>) data.get("sampleTests");
        List<TestCase> testCases = tests.stream()
            .map(t -> new TestCase(t.get("input"), t.get("output")))
            .toList();
            
        return new ProblemResponse(
            (Integer) data.get("contestId"),
            (String) data.get("index"),
            (String) data.get("title"),
            (String) data.get("timeLimit"),
            (String) data.get("memoryLimit"),
            (String) data.get("statement"),
            testCases
        );
    }
}
