package com.m2c.app.web;

import com.m2c.app.service.LeetCodeService;
import com.m2c.app.web.dto.LeetCodeProblemResponse;
import com.m2c.app.web.dto.LeetCodeQuestionListResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leetcode")
@RequiredArgsConstructor
public class LeetCodeController {

    private final LeetCodeService leetCodeService;

    @GetMapping("/questions")
    public ResponseEntity<LeetCodeQuestionListResponse> questions(
            @RequestParam(value = "tags", required = false) String tags,
            @RequestParam(value = "difficulty", required = false) String difficulty,
            @RequestParam(value = "search", required = false) String search
    ) {
        Map<String, Object> response = leetCodeService.fetchQuestions(tags, difficulty, search);
        List<LeetCodeQuestionListResponse.LeetCodeQuestion> questions = new ArrayList<>();
        int total = 0;
        List<String> tagFilters = normalizeCsv(tags);
        String difficultyFilter = difficulty == null ? "" : difficulty.trim().toLowerCase();
        String searchFilter = search == null ? "" : search.trim().toLowerCase();

        Object dataObj = response.get("data");
        if (dataObj instanceof Map<?, ?> data) {
            Object listObj = data.get("problemsetQuestionList");
            if (listObj instanceof Map<?, ?> list) {
                Object totalObj = list.get("total");
                if (totalObj instanceof Number number) {
                    total = number.intValue();
                }
                Object questionsObj = list.get("questions");
                if (questionsObj instanceof List<?> items) {
                    for (Object item : items) {
                        if (!(item instanceof Map<?, ?> question)) {
                            continue;
                        }
                        String title = valueOf(question.get("title"));
                        String titleSlug = valueOf(question.get("titleSlug"));
                        String difficultyValue = valueOf(question.get("difficulty"));
                        if (!difficultyFilter.isBlank() && !difficultyValue.toLowerCase().equals(difficultyFilter)) {
                            continue;
                        }
                        if (!searchFilter.isBlank() && !title.toLowerCase().contains(searchFilter)) {
                            continue;
                        }
                        List<LeetCodeQuestionListResponse.Tag> tagsList = new ArrayList<>();
                        Object tagObj = question.get("topicTags");
                        if (tagObj instanceof List<?> topicTags) {
                            for (Object tagItem : topicTags) {
                                if (tagItem instanceof Map<?, ?> tagMap) {
                                    tagsList.add(new LeetCodeQuestionListResponse.Tag(
                                            valueOf(tagMap.get("name")),
                                            valueOf(tagMap.get("slug"))
                                    ));
                                }
                            }
                        }
                        if (!tagFilters.isEmpty() && !matchesTagFilter(tagFilters, tagsList)) {
                            continue;
                        }
                        questions.add(new LeetCodeQuestionListResponse.LeetCodeQuestion(
                                title,
                                titleSlug,
                                difficultyValue,
                                tagsList
                        ));
                    }
                }
            }
        }

        if (!questions.isEmpty()) {
            total = questions.size();
        }
        return ResponseEntity.ok(new LeetCodeQuestionListResponse(total, questions));
    }

    @GetMapping("/problem/details")
    public ResponseEntity<LeetCodeProblemResponse> problemDetails(@RequestParam("titleSlug") String titleSlug) {
        Map<String, Object> data = leetCodeService.fetchProblemDetails(titleSlug);
        if (data.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Object samplesObj = data.get("sampleTests");
        List<LeetCodeProblemResponse.TestCase> samples = new ArrayList<>();
        if (samplesObj instanceof List<?> items) {
            for (Object item : items) {
                if (item instanceof Map<?, ?> map) {
                    samples.add(new LeetCodeProblemResponse.TestCase(
                            valueOf(map.get("input")),
                            valueOf(map.get("output"))
                    ));
                }
            }
        }

        return ResponseEntity.ok(new LeetCodeProblemResponse(
                valueOf(data.get("titleSlug")),
                valueOf(data.get("title")),
                valueOf(data.get("difficulty")),
                valueOf(data.get("statement")),
                samples
        ));
    }

    private String valueOf(Object value) {
        return value == null ? "" : value.toString();
    }

    private List<String> normalizeCsv(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        List<String> filters = new ArrayList<>();
        for (String part : value.split(",")) {
            String trimmed = part.trim().toLowerCase();
            if (!trimmed.isBlank()) {
                filters.add(trimmed);
            }
        }
        return filters;
    }

    private boolean matchesTagFilter(List<String> filters, List<LeetCodeQuestionListResponse.Tag> tags) {
        for (LeetCodeQuestionListResponse.Tag tag : tags) {
            String name = tag.name() == null ? "" : tag.name().toLowerCase();
            String slug = tag.slug() == null ? "" : tag.slug().toLowerCase();
            for (String filter : filters) {
                if (filter.equals(name) || filter.equals(slug)) {
                    return true;
                }
            }
        }
        return false;
    }
}
