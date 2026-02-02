package com.m2c.app.web.dto;

public record ExecutionResult(
        boolean success,
        String output,
        String error,
        long executionTimeMs
) {}
