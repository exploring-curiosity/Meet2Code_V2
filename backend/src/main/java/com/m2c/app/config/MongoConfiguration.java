package com.m2c.app.config;

import com.mongodb.client.MongoClient;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.util.StringUtils;

@Configuration
public class MongoConfiguration {

    private final MongoClient mongoClient;
    private final MongoProperties properties;
    
    @Value("${spring.data.mongodb.database:m2c}")
    private String databaseName;

    public MongoConfiguration(MongoClient mongoClient, MongoProperties properties) {
        this.mongoClient = mongoClient;
        this.properties = properties;
    }

    @Bean
    public MongoTemplate mongoTemplate() {
        // Try to get database name from properties first, then fall back to injected value
        String dbName = properties.getDatabase();
        if (!StringUtils.hasText(dbName)) {
            dbName = databaseName;
        }
        
        if (!StringUtils.hasText(dbName)) {
            throw new IllegalStateException(
                "MongoDB database name not configured. Please set spring.data.mongodb.database or " +
                "include database name in spring.data.mongodb.uri (e.g., mongodb://localhost:27017/m2c)"
            );
        }
        
        return new MongoTemplate(mongoClient, dbName);
    }
}
