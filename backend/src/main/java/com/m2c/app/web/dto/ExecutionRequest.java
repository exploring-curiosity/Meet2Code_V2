package com.m2c.app.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ExecutionRequest(
        @NotBlank String code,
        @NotBlank String language,
        String input
) {}
