package com.m2c.app.service;

import com.m2c.app.mongo.document.QuestionTestCase;
import com.m2c.app.mongo.repository.QuestionTestCaseRepository;
import com.m2c.app.web.dto.RunTestsResponse;
import com.m2c.app.web.dto.TestCaseDto;
import com.m2c.app.web.dto.TestRunResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class QuestionService {

    private final QuestionTestCaseRepository repository;
    private final CodeExecutionService codeExecutionService;

    public Optional<QuestionTestCase> findTestCases(String contestId, String questionId) {
        return repository.findByContestIdAndQuestionId(contestId, questionId);
    }

    public QuestionTestCase saveTestCases(String contestId, String questionId, List<TestCaseDto> testCases) {
        QuestionTestCase entity = repository.findByContestIdAndQuestionId(contestId, questionId)
                .orElseGet(QuestionTestCase::new);
        entity.setContestId(contestId);
        entity.setQuestionId(questionId);

        List<QuestionTestCase.TestCase> mapped = new ArrayList<>();
        if (testCases != null) {
            for (TestCaseDto testCase : testCases) {
                QuestionTestCase.TestCase item = new QuestionTestCase.TestCase();
                item.setInput(testCase.input());
                item.setOutput(testCase.output());
                mapped.add(item);
            }
        }
        entity.setTestCases(mapped);
        return repository.save(entity);
    }

    public RunTestsResponse runTests(String code, String language, List<TestCaseDto> testCases) {
        if (testCases == null || testCases.isEmpty()) {
            return new RunTestsResponse(0, 0, List.of());
        }
        List<TestRunResult> results = new ArrayList<>();
        int passed = 0;
        for (TestCaseDto testCase : testCases) {
            CodeExecutionService.ExecutionResult execution = codeExecutionService.executeCode(
                    code,
                    language,
                    testCase.input() == null ? "" : testCase.input()
            );
            String expected = testCase.output() == null ? "" : testCase.output().trim();
            String actual = execution.output() == null ? "" : execution.output().trim();
            boolean success = execution.success() && expected.equals(actual);
            if (success) {
                passed++;
            }
            results.add(new TestRunResult(
                    testCase.input(),
                    expected,
                    actual,
                    execution.error(),
                    execution.executionTimeMs(),
                    success
            ));
        }
        return new RunTestsResponse(passed, testCases.size(), results);
    }
}
