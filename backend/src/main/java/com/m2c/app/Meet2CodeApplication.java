package com.m2c.app;

import com.m2c.app.config.AppProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;


@SpringBootApplication
@EnableConfigurationProperties(AppProperties.class)
@EnableScheduling
@EnableCaching
public class Meet2CodeApplication {

    public static void main(String[] args) {
        SpringApplication.run(Meet2CodeApplication.class, args);
    }
}
