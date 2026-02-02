package com.m2c.app.mongo.repository;

import com.m2c.app.mongo.document.QuestionTestCase;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface QuestionTestCaseRepository extends MongoRepository<QuestionTestCase, String> {

    Optional<QuestionTestCase> findByContestIdAndQuestionId(String contestId, String questionId);
}
