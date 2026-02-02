package com.m2c.app.web.dto;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record SaveTestCasesRequest(
        @NotBlank(message = "Contest ID is required")
        String contestId,
        @NotBlank(message = "Question ID is required")
        String questionId,
        List<TestCaseDto> testCases
) {}
