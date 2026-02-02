package com.m2c.app.web.dto;

import java.util.List;

public record LeetCodeQuestionListResponse(
        int total,
        List<LeetCodeQuestion> questions
) {
    public record LeetCodeQuestion(
            String title,
            String titleSlug,
            String difficulty,
            List<Tag> topicTags
    ) {}

    public record Tag(String name, String slug) {}
}
