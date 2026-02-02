package com.m2c.app.mongo.document;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Document(collection = "question_testcases")
public class QuestionTestCase {

    @Id
    private String id;

    private String contestId;

    private String questionId;

    private List<TestCase> testCases = new ArrayList<>();

    @Getter
    @Setter
    @NoArgsConstructor
    public static class TestCase {
        private String input;
        private String output;
    }
}
