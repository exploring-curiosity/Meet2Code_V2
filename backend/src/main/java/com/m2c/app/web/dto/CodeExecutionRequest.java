package com.m2c.app.web.dto;

import jakarta.validation.constraints.NotBlank;

public record CodeExecutionRequest(
        @NotBlank(message = "Code is required")
        String code,
        
        @NotBlank(message = "Language is required")
        String language,
        
        String input
) {}
