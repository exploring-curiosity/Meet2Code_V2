package com.m2c.app.web.dto;

import java.util.List;

public record RunTestsResponse(
        int passed,
        int total,
        List<TestRunResult> results
) {}
