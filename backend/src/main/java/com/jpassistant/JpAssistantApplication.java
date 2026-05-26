package com.jpassistant;

import com.jpassistant.config.AiServiceProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication
@EnableConfigurationProperties(AiServiceProperties.class)
public class JpAssistantApplication {

    /**
     * Starts the Spring Boot backend application.
     *
     * @param args command-line arguments
     */
    public static void main(String[] args) {
        SpringApplication.run(JpAssistantApplication.class, args);
    }
}
