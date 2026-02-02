package com.m2c.app.web.dto;

public record TestRunResult(
        String input,
        String expectedOutput,
        String actualOutput,
        String error,
        long executionTimeMs,
        boolean success
) {}
