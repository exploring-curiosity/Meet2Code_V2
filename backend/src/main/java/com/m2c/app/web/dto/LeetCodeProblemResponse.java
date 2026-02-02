package com.m2c.app.web.dto;

import java.util.List;

public record LeetCodeProblemResponse(
        String titleSlug,
        String title,
        String difficulty,
        String statement,
        List<TestCase> sampleTests
) {
    public record TestCase(String input, String output) {}
}
