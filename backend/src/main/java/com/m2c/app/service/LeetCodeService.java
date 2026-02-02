package com.m2c.app.service;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class LeetCodeService {

    private static final String QUESTION_LIST_QUERY = """
            query problemsetQuestionListV2($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionFilterInput) {
              problemsetQuestionListV2(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                questions {
                  title
                  titleSlug
                  difficulty
                  topicTags { name slug }
                }
              }
            }
            """;

    private static final String QUESTION_LIST_FALLBACK_QUERY = """
            query problemsetPanelQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionFilterInput) {
              problemsetPanelQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                questions {
                  title
                  titleSlug
                  difficulty
                  topicTags { name slug }
                }
              }
            }
            """;

    private static final String QUESTION_LIST_SECOND_FALLBACK_QUERY = """
            query panelQuestionList($categorySlug: String, $limit: Int, $skip: Int, $filters: QuestionFilterInput) {
              panelQuestionList(categorySlug: $categorySlug, limit: $limit, skip: $skip, filters: $filters) {
                questions {
                  title
                  titleSlug
                  difficulty
                  topicTags { name slug }
                }
              }
            }
            """;

    private static final String QUESTION_DETAIL_QUERY = """
            query questionData($titleSlug: String!) {
              question(titleSlug: $titleSlug) {
                title
                titleSlug
                content
                difficulty
                topicTags { name slug }
              }
            }
            """;

    private final WebClient leetCodeClient;

    public LeetCodeService(@Qualifier("leetCodeClient") WebClient leetCodeClient) {
        this.leetCodeClient = leetCodeClient;
    }

    @Cacheable(cacheNames = "leetcodeQuestionList", key = "T(java.util.Objects).toString(#tags,'') + '|' + T(java.util.Objects).toString(#difficulty,'') + '|' + T(java.util.Objects).toString(#search,'')")
    public Map<String, Object> fetchQuestions(String tags, String difficulty, String search) {
        Map<String, Object> response = fetchQuestionList(Map.of());
        int total = extractTotalFromResponse(response);
        if (total > 0) {
            return response;
        }
        return response;
    }

    private Map<String, Object> fetchQuestionList(Map<String, Object> filters) {
        Map<String, Object> variables = new HashMap<>();
        variables.put("categorySlug", "");
        variables.put("limit", 50);
        variables.put("skip", 0);
        if (!filters.isEmpty()) {
            variables.put("filters", filters);
        }

        Map<String, Object> payload = Map.of(
                "query", QUESTION_LIST_QUERY,
                "variables", variables
        );

        Map<String, Object> response = executeQuery(payload, "question list");
        Map<String, Object> normalized = normalizeQuestionList(response, "problemsetQuestionListV2");
        if (!normalized.isEmpty()) {
            return normalized;
        }

        Map<String, Object> fallbackPayload = Map.of(
                "query", QUESTION_LIST_FALLBACK_QUERY,
                "variables", variables
        );

        Map<String, Object> fallbackResponse = executeQuery(fallbackPayload, "question list fallback");
        Map<String, Object> fallbackNormalized = normalizeQuestionList(fallbackResponse, "problemsetPanelQuestionList");
        if (!fallbackNormalized.isEmpty()) {
            return fallbackNormalized;
        }

        Map<String, Object> secondFallbackPayload = Map.of(
                "query", QUESTION_LIST_SECOND_FALLBACK_QUERY,
                "variables", variables
        );
        Map<String, Object> secondFallbackResponse = executeQuery(secondFallbackPayload, "question list fallback 2");
        Map<String, Object> secondNormalized = normalizeQuestionList(secondFallbackResponse, "panelQuestionList");
        return secondNormalized.isEmpty() ? response : secondNormalized;
    }

    private Map<String, Object> normalizeQuestionList(Map<String, Object> response, String listKey) {
        if (response.isEmpty()) {
            return Map.of();
        }
        Object dataObj = response.get("data");
        if (!(dataObj instanceof Map<?, ?> data)) {
            return Map.of();
        }
        Object listObj = data.get(listKey);
        if (!(listObj instanceof Map<?, ?> list)) {
            return Map.of();
        }
        int total = extractTotal(list);
        Map<String, Object> normalizedList = ensureTotal(list, total);
        return Map.of("data", Map.of("problemsetQuestionList", normalizedList));
    }

    private int extractTotalFromResponse(Map<String, Object> response) {
        if (response.isEmpty()) {
            return 0;
        }
        Object dataObj = response.get("data");
        if (!(dataObj instanceof Map<?, ?> data)) {
            return 0;
        }
        Object listObj = data.get("problemsetQuestionList");
        if (!(listObj instanceof Map<?, ?> list)) {
            return 0;
        }
        return extractTotal(list);
    }

    private int extractTotal(Map<?, ?> list) {
        Object totalObj = list.get("total");
        if (totalObj instanceof Number number) {
            return number.intValue();
        }
        Object questionsObj = list.get("questions");
        if (questionsObj instanceof List<?> questions) {
            return questions.size();
        }
        return 0;
    }

    private Map<String, Object> ensureTotal(Map<?, ?> list, int total) {
        Map<String, Object> normalized = new HashMap<>();
        for (Map.Entry<?, ?> entry : list.entrySet()) {
            if (entry.getKey() != null) {
                normalized.put(entry.getKey().toString(), entry.getValue());
            }
        }
        normalized.putIfAbsent("total", total);
        return normalized;
    }

    private Map<String, Object> executeQuery(Map<String, Object> payload, String label) {
        try {
            Map<String, Object> response = leetCodeClient.post()
                    .uri("/graphql")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
            Map<String, Object> safeResponse = response == null ? Map.of() : response;
            Object errorsObj = safeResponse.get("errors");
            if (errorsObj instanceof List<?> errors && !errors.isEmpty()) {
                log.warn("LeetCode {} errors: {}", label, errors);
            }
            return safeResponse;
        } catch (WebClientResponseException ex) {
            log.warn("LeetCode {} fetch failed: status={}, body={}", label, ex.getStatusCode(), ex.getResponseBodyAsString());
            return Map.of();
        } catch (Exception ex) {
            log.warn("LeetCode {} fetch failed", label, ex);
            return Map.of();
        }
    }

    @Cacheable(cacheNames = "leetcodeProblemDetails", key = "#titleSlug")
    public Map<String, Object> fetchProblemDetails(String titleSlug) {
        Map<String, Object> payload = Map.of(
                "query", QUESTION_DETAIL_QUERY,
                "variables", Map.of("titleSlug", titleSlug)
        );

        Map<String, Object> response;
        try {
            response = leetCodeClient.post()
                    .uri("/graphql")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(payload)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
        } catch (WebClientResponseException ex) {
            log.warn("LeetCode problem fetch failed: status={}, body={}", ex.getStatusCode(), ex.getResponseBodyAsString());
            return Map.of();
        } catch (Exception ex) {
            log.warn("LeetCode problem fetch failed", ex);
            return Map.of();
        }

        if (response == null) {
            return Map.of();
        }

        Object dataObj = response.get("data");
        if (!(dataObj instanceof Map<?, ?> data)) {
            return Map.of();
        }
        Object questionObj = data.get("question");
        if (!(questionObj instanceof Map<?, ?> question)) {
            return Map.of();
        }

        String title = Optional.ofNullable(question.get("title")).map(Object::toString).orElse("Untitled");
        String difficulty = Optional.ofNullable(question.get("difficulty")).map(Object::toString).orElse("");
        String content = Optional.ofNullable(question.get("content")).map(Object::toString).orElse("");

        List<Map<String, String>> sampleTests = parseSampleTests(content);

        return Map.of(
                "titleSlug", titleSlug,
                "title", title,
                "difficulty", difficulty,
                "statement", content,
                "sampleTests", sampleTests
        );
    }

    private List<Map<String, String>> parseSampleTests(String html) {
        if (html == null || html.isBlank()) {
            return List.of();
        }
        Document doc = Jsoup.parse(html);
        Elements exampleHeaders = doc.select("p strong:matchesOwn(^Example\\s*\\d*:)" );
        List<Map<String, String>> samples = new ArrayList<>();
        for (Element header : exampleHeaders) {
            Element parent = header.parent();
            Element pre = null;
            Element cursor = parent;
            for (int i = 0; i < 3 && cursor != null && pre == null; i++) {
                cursor = cursor.nextElementSibling();
                if (cursor != null && cursor.tagName().equals("pre")) {
                    pre = cursor;
                    break;
                }
            }
            if (pre == null) {
                continue;
            }
            String text = pre.text();
            String input = extractBetween(text, "Input:", "Output:");
            String output = extractAfter(text, "Output:");
            if (input.isBlank() && output.isBlank()) {
                continue;
            }
            samples.add(Map.of(
                    "input", input.trim(),
                    "output", output.trim()
            ));
        }
        return samples;
    }

    private String extractBetween(String text, String start, String end) {
        int startIdx = text.indexOf(start);
        if (startIdx < 0) {
            return "";
        }
        int endIdx = text.indexOf(end, startIdx + start.length());
        if (endIdx < 0) {
            return text.substring(startIdx + start.length());
        }
        return text.substring(startIdx + start.length(), endIdx);
    }

    private String extractAfter(String text, String start) {
        int startIdx = text.indexOf(start);
        if (startIdx < 0) {
            return "";
        }
        return text.substring(startIdx + start.length());
    }
}
