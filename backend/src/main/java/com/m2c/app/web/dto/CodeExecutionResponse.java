package com.m2c.app.web.dto;

public record CodeExecutionResponse(
        boolean success,
        String output,
        String error,
        long executionTimeMs
) {}
