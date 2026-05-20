package com.jpassistant;

import com.jpassistant.config.AiServiceProperties;
import com.jpassistant.config.AuthProperties;
import org.springframework.boot.autoconfigure.data.neo4j.Neo4jReactiveRepositoriesAutoConfiguration;
import org.springframework.boot.autoconfigure.data.neo4j.Neo4jRepositoriesAutoConfiguration;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

@SpringBootApplication(exclude = {
        Neo4jRepositoriesAutoConfiguration.class,
        Neo4jReactiveRepositoriesAutoConfiguration.class
})
@EnableConfigurationProperties({AiServiceProperties.class, AuthProperties.class})
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
