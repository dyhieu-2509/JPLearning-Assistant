package com.jpassistant.application.service.impl;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.AiTutorChatRequest;
import com.jpassistant.application.dto.request.ChatRequest;
import com.jpassistant.application.dto.response.ChatMessageResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.dto.response.ChatSessionResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.SourceResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.application.service.ChatService;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.chat.ChatMessage;
import com.jpassistant.domain.chat.ChatMessageRole;
import com.jpassistant.domain.chat.ChatSession;
import com.jpassistant.infrastructure.persistence.jpa.ChatMessageJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.ChatSessionJpaRepository;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ChatServiceImpl implements ChatService {

    private static final int WEAK_PROGRESS_LIMIT = 5;
    private static final int DEFAULT_SESSION_LIMIT = 20;
    private static final int DEFAULT_MESSAGE_LIMIT = 100;
    private static final int MAX_LIMIT = 100;
    private static final Pattern LEVEL_PATTERN = Pattern.compile("N[45]");
    private static final TypeReference<List<SourceResponse>> SOURCE_LIST_TYPE = new TypeReference<>() {
    };

    private final AiServiceClient aiServiceClient;
    private final PersonalizationService personalizationService;
    private final ChatSessionJpaRepository sessionRepository;
    private final ChatMessageJpaRepository messageRepository;
    private final ObjectMapper objectMapper;

    /**
     * Creates the chat service.
     *
     * @param aiServiceClient internal AI service client
     * @param personalizationService learner personalization service
     */
    public ChatServiceImpl(
            AiServiceClient aiServiceClient,
            PersonalizationService personalizationService,
            ChatSessionJpaRepository sessionRepository,
            ChatMessageJpaRepository messageRepository,
            ObjectMapper objectMapper
    ) {
        this.aiServiceClient = aiServiceClient;
        this.personalizationService = personalizationService;
        this.sessionRepository = sessionRepository;
        this.messageRepository = messageRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Handles a learner chat request.
     *
     * @param request chat request payload
     * @return tutor response from the AI service
     */
    @Override
    public ChatResponse chat(ChatRequest request) {
        return chat(request.userId(), request);
    }

    @Override
    @Transactional
    public ChatResponse chat(String authenticatedUserId, ChatRequest request) {
        String userId = normalizeUserId(authenticatedUserId);
        ChatSession session = findOrCreateSession(userId, request);
        ChatResponse aiResponse = aiServiceClient.chat(toTutorRequest(userId, request));
        ChatResponse response = new ChatResponse(
                aiResponse.answer(),
                aiResponse.sources(),
                aiResponse.confidence(),
                session.getId()
        );

        messageRepository.save(new ChatMessage(
                session,
                ChatMessageRole.USER,
                request.message().trim(),
                null,
                null
        ));
        messageRepository.save(new ChatMessage(
                session,
                ChatMessageRole.ASSISTANT,
                response.answer(),
                serializeSources(response.sources()),
                response.confidence()
        ));
        session.touch();
        sessionRepository.save(session);
        recordSourceExposure(userId, response.sources());
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatSessionResponse> getSessions(String authenticatedUserId, Integer limit) {
        String userId = normalizeUserId(authenticatedUserId);
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId, PageRequest.of(0, normalizeLimit(
                        limit,
                        DEFAULT_SESSION_LIMIT
                )))
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(String authenticatedUserId, UUID sessionId, Integer limit) {
        String userId = normalizeUserId(authenticatedUserId);
        ChatSession session = sessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new InvalidRequestException("chat session was not found"));
        return messageRepository.findBySessionIdOrderByCreatedAtAsc(session.getId(), PageRequest.of(0, normalizeLimit(
                        limit,
                        DEFAULT_MESSAGE_LIMIT
                )))
                .stream()
                .map(this::toMessageResponse)
                .toList();
    }

    private AiTutorChatRequest toTutorRequest(String userId, ChatRequest request) {
        StudentProfileResponse profile = personalizationService.getOrCreateProfile(userId);
        List<KnowledgeProgressResponse> weakProgress = personalizationService.getProgress(
                userId,
                true,
                WEAK_PROGRESS_LIMIT
        );
        return new AiTutorChatRequest(
                request.message(),
                userId,
                request.contextTopic(),
                profile,
                weakProgress
        );
    }

    private ChatSession findOrCreateSession(String userId, ChatRequest request) {
        if (request.sessionId() != null) {
            ChatSession session = sessionRepository.findByIdAndUserId(request.sessionId(), userId)
                    .orElseThrow(() -> new InvalidRequestException("chat session was not found"));
            if (request.contextTopic() != null && !request.contextTopic().isBlank()) {
                session.setContextTopic(request.contextTopic().trim());
            }
            return session;
        }
        return sessionRepository.save(new ChatSession(
                userId,
                summarizeTitle(request.message()),
                optionalText(request.contextTopic())
        ));
    }

    private void recordSourceExposure(String userId, List<SourceResponse> sources) {
        if (sources == null || sources.isEmpty()) {
            return;
        }
        for (SourceResponse source : sources) {
            if (source.type() != null && !source.type().isBlank()
                    && source.id() != null && !source.id().isBlank()) {
                personalizationService.recordExposure(userId, new KnowledgeProgressRequest(
                        source.type(),
                        source.id(),
                        source.title(),
                        extractLevel(source.id())
                ));
            }
        }
    }

    private String normalizeUserId(String userId) {
        if (userId == null || userId.isBlank()) {
            throw new InvalidRequestException("authenticated user is required");
        }
        return userId.trim();
    }

    private int normalizeLimit(Integer limit, int defaultLimit) {
        if (limit == null) {
            return defaultLimit;
        }
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }

    private String summarizeTitle(String message) {
        String normalized = message == null ? "New chat" : message.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= 80) {
            return normalized;
        }
        return normalized.substring(0, 77) + "...";
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String extractLevel(String sourceId) {
        Matcher matcher = LEVEL_PATTERN.matcher(sourceId.toUpperCase());
        return matcher.find() ? matcher.group() : null;
    }

    private String serializeSources(List<SourceResponse> sources) {
        if (sources == null || sources.isEmpty()) {
            return "[]";
        }
        try {
            return objectMapper.writeValueAsString(sources);
        } catch (JsonProcessingException ex) {
            throw new IllegalStateException("Could not serialize chat sources", ex);
        }
    }

    private List<SourceResponse> deserializeSources(String sourcesJson) {
        if (sourcesJson == null || sourcesJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(sourcesJson, SOURCE_LIST_TYPE);
        } catch (JsonProcessingException ex) {
            return List.of();
        }
    }

    private ChatSessionResponse toSessionResponse(ChatSession session) {
        return new ChatSessionResponse(
                session.getId(),
                session.getUserId(),
                session.getTitle(),
                session.getContextTopic(),
                session.getStartedAt(),
                session.getUpdatedAt()
        );
    }

    private ChatMessageResponse toMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getSession().getId(),
                message.getRole().name(),
                message.getContent(),
                deserializeSources(message.getSourcesJson()),
                message.getConfidence(),
                message.getCreatedAt()
        );
    }
}
