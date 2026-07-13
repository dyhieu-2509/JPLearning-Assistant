package com.jpassistant.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Condition;
import org.springframework.context.annotation.ConditionContext;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.core.type.AnnotatedTypeMetadata;
import org.springframework.security.config.oauth2.client.CommonOAuth2Provider;
import org.springframework.security.oauth2.client.InMemoryOAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;

@Configuration
@Conditional(GoogleOAuth2ClientConfig.GoogleOAuth2ConfiguredCondition.class)
public class GoogleOAuth2ClientConfig {

    private static final String CLIENT_ID_PROPERTY =
            "spring.security.oauth2.client.registration.google.client-id";
    private static final String CLIENT_SECRET_PROPERTY =
            "spring.security.oauth2.client.registration.google.client-secret";

    @Bean
    public ClientRegistrationRepository clientRegistrationRepository(Environment environment) {
        ClientRegistration google = CommonOAuth2Provider.GOOGLE
                .getBuilder("google")
                .clientId(required(environment, CLIENT_ID_PROPERTY))
                .clientSecret(required(environment, CLIENT_SECRET_PROPERTY))
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .build();
        return new InMemoryClientRegistrationRepository(google);
    }

    @Bean
    public OAuth2AuthorizedClientService authorizedClientService(
            ClientRegistrationRepository clientRegistrationRepository
    ) {
        return new InMemoryOAuth2AuthorizedClientService(clientRegistrationRepository);
    }

    private static String required(Environment environment, String key) {
        String value = environment.getProperty(key);
        if (value == null || value.isBlank()) {
            throw new IllegalStateException(key + " must be configured when Google OAuth2 is enabled");
        }
        return value.trim();
    }

    static final class GoogleOAuth2ConfiguredCondition implements Condition {

        @Override
        public boolean matches(ConditionContext context, AnnotatedTypeMetadata metadata) {
            Environment environment = context.getEnvironment();
            return hasText(environment.getProperty(CLIENT_ID_PROPERTY))
                    && hasText(environment.getProperty(CLIENT_SECRET_PROPERTY));
        }

        private boolean hasText(String value) {
            return value != null && !value.isBlank();
        }
    }
}
