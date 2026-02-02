package com.m2c.app.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record RunTestsRequest(
        @NotBlank(message = "Code is required")
        String code,
        @NotBlank(message = "Language is required")
        String language,
        List<TestCaseDto> testCases
) {}
