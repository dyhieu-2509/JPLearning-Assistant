package com.jpassistant.api.v1;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.not;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.jpassistant.application.dto.request.GoogleOAuth2LoginRequest;
import com.jpassistant.application.dto.response.AiAssessmentGenerateResponse;
import com.jpassistant.application.dto.response.AiAssessmentQuestionResponse;
import com.jpassistant.application.dto.response.AiPlannerResponse;
import com.jpassistant.application.dto.response.AiPronunciationScoreResponse;
import com.jpassistant.application.dto.response.ChatResponse;
import com.jpassistant.application.dto.response.SourceResponse;
import com.jpassistant.application.dto.response.StudyPlanItemResponse;
import com.jpassistant.domain.auth.UserRole;
import com.jpassistant.application.port.out.AiServiceClient;
import com.jpassistant.domain.auth.AuthProvider;
import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import com.jpassistant.infrastructure.persistence.jpa.UserAuthProviderJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.UserJpaRepository;
import com.jpassistant.infrastructure.security.JwtTokenProvider;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = {
        "debug=false",
        "logging.level.root=WARN",
        "logging.level.org.springframework=WARN",
        "logging.level.org.hibernate.SQL=WARN"
})
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiIntegrationTest {

    private static final String PASSWORD = "Password123!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private UserAuthProviderJpaRepository providerRepository;

    @Autowired
    private UserJpaRepository userRepository;

    @MockBean
    private AiServiceClient aiServiceClient;

    @MockBean
    private KnowledgeGraphRepository knowledgeGraphRepository;

    @Test
    void authRegisterLoginRefreshAndLogoutUseUnifiedJwtContract() throws Exception {
        String email = uniqueEmail("auth");
        JsonNode registerResponse = register(email);
        String originalAccessToken = registerResponse.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/personalization/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(originalAccessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", not(blankOrNullString())));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", email,
                                "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.expiresIn").value(480))
                .andExpect(jsonPath("$.user.email").value(email));

        String refreshToken = registerResponse.get("refreshToken").asText();
        MvcResult refreshResult = mockMvc.perform(post("/api/v1/auth/refresh")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.expiresIn").value(480))
                .andReturn();

        JsonNode rotatedSession = readJson(refreshResult);
        String rotatedAccessToken = rotatedSession.get("accessToken").asText();
        String rotatedRefreshToken = rotatedSession.get("refreshToken").asText();

        mockMvc.perform(get("/api/v1/personalization/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(originalAccessToken)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/v1/personalization/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(rotatedAccessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.userId", not(blankOrNullString())));

        mockMvc.perform(post("/api/v1/auth/logout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("refreshToken", rotatedRefreshToken))))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/v1/personalization/me/profile")
                        .header(HttpHeaders.AUTHORIZATION, bearer(rotatedAccessToken)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void googleAccountLinkRequiresLocalPasswordAndCreatesGoogleProvider() throws Exception {
        String email = uniqueEmail("link");
        register(email);
        String providerUserId = "google-sub-" + System.nanoTime();
        String linkToken = jwtTokenProvider.createGoogleAccountLinkToken(new GoogleOAuth2LoginRequest(
                providerUserId,
                email,
                true,
                "Google Name",
                "https://cdn.example.com/google-avatar.png"
        ));

        mockMvc.perform(post("/api/v1/auth/google/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "linkToken", linkToken,
                                "password", "wrong-password"
                        ))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/google/link")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "linkToken", linkToken,
                                "password", PASSWORD
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.user.email").value(email));

        assertThat(providerRepository.findByProviderAndProviderUserId(AuthProvider.GOOGLE, providerUserId))
                .isPresent();
    }

    @Test
    void knowledgeVocabularySearchIsPublicAndUsesRepositoryResult() throws Exception {
        when(knowledgeGraphRepository.searchVocabulary(eq("taberu"), eq("N5"), eq(3)))
                .thenReturn(List.of(new KnowledgeItem(
                        "Vocabulary",
                        "たべます:N5",
                        "食べます",
                        "たべます",
                        "",
                        "eat",
                        "N5",
                        "MinnaNoDS"
                )));

        mockMvc.perform(get("/api/v1/knowledge/vocabulary")
                        .param("q", "taberu")
                        .param("level", "N5")
                        .param("limit", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("たべます:N5"))
                .andExpect(jsonPath("$[0].title").value("食べます"))
                .andExpect(jsonPath("$[0].meaningEn").value("eat"));
    }

    @Test
    void chatRequiresJwtPersistsMessagesAndRecordsSourceExposureOnly() throws Exception {
        when(aiServiceClient.chat(any())).thenReturn(new ChatResponse(
                "食べます nghĩa là ăn.",
                List.of(new SourceResponse("Vocabulary", "たべます:N5", "食べます")),
                0.8
        ));

        JsonNode authResponse = register(uniqueEmail("chat"));
        String accessToken = authResponse.get("accessToken").asText();

        mockMvc.perform(post("/api/v1/chat")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "message", "eat trong tiếng Nhật là gì?",
                                "contextTopic", "vocabulary"
                        ))))
                .andExpect(status().isUnauthorized());

        MvcResult chatResult = mockMvc.perform(post("/api/v1/chat")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "message", "eat trong tiếng Nhật là gì?",
                                "contextTopic", "vocabulary"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.answer").value("食べます nghĩa là ăn."))
                .andExpect(jsonPath("$.sessionId", not(blankOrNullString())))
                .andExpect(jsonPath("$.sources[0].id").value("たべます:N5"))
                .andReturn();

        String sessionId = readJson(chatResult).get("sessionId").asText();
        mockMvc.perform(get("/api/v1/chat/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(greaterThan(0))))
                .andExpect(jsonPath("$[0].id").value(sessionId));

        mockMvc.perform(get("/api/v1/chat/sessions/{sessionId}/messages", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].role").value("USER"))
                .andExpect(jsonPath("$[1].role").value("ASSISTANT"))
                .andExpect(jsonPath("$[1].sources[0].id").value("たべます:N5"));

        mockMvc.perform(get("/api/v1/personalization/me/progress")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].knowledgeId").value("たべます:N5"))
                .andExpect(jsonPath("$[0].exposureCount").value(1))
                .andExpect(jsonPath("$[0].masteryScore").value(0.0));
    }

    @Test
    void flashcardReviewRequiresJwtAndUpdatesMasteryThroughLearningSignal() throws Exception {
        JsonNode authResponse = register(uniqueEmail("flashcard"));
        String accessToken = authResponse.get("accessToken").asText();
        Map<String, String> review = Map.of(
                "knowledgeType", "Vocabulary",
                "knowledgeId", "たべます:N5",
                "title", "食べます",
                "level", "N5",
                "rating", "GOOD"
        );

        mockMvc.perform(post("/api/v1/flashcards/review")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(review)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/flashcards/review")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(review)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.knowledgeId").value("たべます:N5"))
                .andExpect(jsonPath("$.correctCount").value(1))
                .andExpect(jsonPath("$.wrongCount").value(0))
                .andExpect(jsonPath("$.masteryScore").value(0.08));
    }

    @Test
    void flashcardDeckLifecycleCreatesCardsTracksDueCardsAndReviewsByCardId() throws Exception {
        when(knowledgeGraphRepository.searchVocabulary(eq(""), eq("N5"), eq(2)))
                .thenReturn(List.of(new KnowledgeItem(
                        "Vocabulary",
                        "tabemasu:N5",
                        "tabemasu",
                        "tabemasu",
                        "an",
                        "eat",
                        "N5",
                        "seed"
                )));
        JsonNode authResponse = register(uniqueEmail("flashcard-deck"));
        String accessToken = authResponse.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/flashcards/decks"))
                .andExpect(status().isUnauthorized());

        MvcResult deckResult = mockMvc.perform(post("/api/v1/flashcards/decks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "title", "N5 vocabulary",
                                "level", "N5",
                                "category", "vocabulary",
                                "autoGenerate", true,
                                "limit", 2
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("N5 vocabulary"))
                .andExpect(jsonPath("$.cardCount").value(1))
                .andReturn();

        String deckId = readJson(deckResult).get("id").asText();
        MvcResult cardResult = mockMvc.perform(get("/api/v1/flashcards/decks/{deckId}/cards", deckId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].frontText").value("tabemasu"))
                .andExpect(jsonPath("$[0].sourceId").value("tabemasu:N5"))
                .andExpect(jsonPath("$[0].repetitions").value(0))
                .andReturn();

        String cardId = readJson(cardResult).get(0).get("id").asText();
        mockMvc.perform(get("/api/v1/flashcards/review/due")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(cardId));

        mockMvc.perform(post("/api/v1/flashcards/review")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "cardId", cardId,
                                "rating", "GOOD"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.card.id").value(cardId))
                .andExpect(jsonPath("$.card.repetitions").value(1))
                .andExpect(jsonPath("$.card.intervalDays").value(1))
                .andExpect(jsonPath("$.progress.knowledgeId").value("tabemasu:N5"))
                .andExpect(jsonPath("$.progress.masteryScore").value(0.08));

        mockMvc.perform(get("/api/v1/flashcards/review/due")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    void plannerRecommendRequiresJwtAndReturnsPersonalizedContext() throws Exception {
        when(aiServiceClient.recommendPlan(any())).thenReturn(new AiPlannerResponse(
                "N5",
                "JLPT N4",
                List.of(new StudyPlanItemResponse(1, "AI base plan", "Study core N5 grammar.", 2.5))
        ));
        JsonNode authResponse = register(uniqueEmail("planner"));
        String accessToken = authResponse.get("accessToken").asText();
        Map<String, Object> plannerRequest = Map.of(
                "targetLevel", "N4",
                "weeklyStudyHours", 5,
                "goal", "JLPT N4"
        );

        mockMvc.perform(post("/api/v1/planner/recommend")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(plannerRequest)))
                .andExpect(status().isUnauthorized());

        MvcResult recommendResult = mockMvc.perform(post("/api/v1/planner/recommend")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(plannerRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.planId", not(blankOrNullString())))
                .andExpect(jsonPath("$.level").value("N5"))
                .andExpect(jsonPath("$.targetLevel").value("N4"))
                .andExpect(jsonPath("$.weeklyStudyHours").value(5))
                .andExpect(jsonPath("$.items[0].title").value("Move one step on the JLPT path"))
                .andExpect(jsonPath("$.items[1].title").value("AI base plan"))
                .andExpect(jsonPath("$.context.profile.userId", not(blankOrNullString())))
                .andReturn();

        String planId = readJson(recommendResult).get("planId").asText();
        MvcResult savedPlanResult = mockMvc.perform(get("/api/v1/planner/plans/{planId}", planId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(planId))
                .andExpect(jsonPath("$.totalItems").value(2))
                .andExpect(jsonPath("$.completedItems").value(0))
                .andExpect(jsonPath("$.items[0].id", not(blankOrNullString())))
                .andReturn();

        String itemId = readJson(savedPlanResult).get("items").get(0).get("id").asText();
        mockMvc.perform(post("/api/v1/planner/plans/{planId}/items/{itemId}/complete", planId, itemId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedItems").value(1))
                .andExpect(jsonPath("$.completionRate").value(50.0))
                .andExpect(jsonPath("$.items[0].completed").value(true));

        mockMvc.perform(get("/api/v1/planner/plans")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(planId));
    }

    @Test
    void pronunciationScoreRequiresJwtAndRecordsProgressSignal() throws Exception {
        JsonNode authResponse = register(uniqueEmail("pronunciation"));
        String accessToken = authResponse.get("accessToken").asText();
        when(aiServiceClient.scorePronunciation(
                eq("はじめまして。"),
                eq("Chào hỏi"),
                eq("N5"),
                any(byte[].class),
                eq("voice.webm"),
                eq(MediaType.parseMediaType("audio/webm"))
        )).thenReturn(new AiPronunciationScoreResponse(
                "はじめまして。",
                88,
                "GOOD",
                "Bạn đọc rõ. Giữ nhịp này.",
                List.of("Ổn"),
                0.86
        ));
        MockMultipartFile audio = new MockMultipartFile(
                "audio",
                "voice.webm",
                "audio/webm",
                new byte[] {1, 2, 3}
        );

        mockMvc.perform(multipart("/api/v1/pronunciation/score")
                        .file(audio)
                        .param("targetText", "はじめまして。")
                        .param("lessonId", "conversation-greetings")
                        .param("lessonTitle", "Chào hỏi")
                        .param("taskId", "conversation-greetings-practice")
                        .param("taskTitle", "Đóng vai hội thoại")
                        .param("level", "N5")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transcript").value("はじめまして。"))
                .andExpect(jsonPath("$.scorePercent").value(88))
                .andExpect(jsonPath("$.verdict").value("GOOD"))
                .andExpect(jsonPath("$.progress.knowledgeType").value("Pronunciation"))
                .andExpect(jsonPath("$.progress.knowledgeId").value(
                        "conversation-greetings:conversation-greetings-practice"
                ));
    }

    @Test
    void learnerDashboardSummarizesPersonalizedData() throws Exception {
        when(aiServiceClient.chat(any())).thenReturn(new ChatResponse(
                "Use は for topic marking.",
                List.of(new SourceResponse("GrammarPoint", "particle-wa:N5", "は")),
                0.8
        ));
        when(aiServiceClient.generateAssessment(any())).thenReturn(new AiAssessmentGenerateResponse(List.of(
                new AiAssessmentQuestionResponse(
                        "grammar-q-dashboard",
                        "Choose the dictionary form.",
                        List.of("taberu", "tabemasu"),
                        "taberu",
                        "tabemasu is the polite form."
                )
        )));
        JsonNode authResponse = register(uniqueEmail("dashboard"));
        String accessToken = authResponse.get("accessToken").asText();

        mockMvc.perform(get("/api/v1/personalization/me/dashboard"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/flashcards/decks")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "title", "Manual vocab",
                                "level", "N5",
                                "category", "vocabulary",
                                "cards", List.of(Map.of(
                                        "frontText", "tabemasu",
                                        "backText", "eat",
                                        "reading", "tabemasu",
                                        "sourceType", "Vocabulary",
                                        "sourceId", "tabemasu:N5",
                                        "level", "N5"
                                ))
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/chat")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "message", "particle wa la gi?",
                                "contextTopic", "grammar"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/personalization/me/progress/signals")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "knowledgeType", "Vocabulary",
                                "knowledgeId", "tabemasu:N5",
                                "title", "tabemasu",
                                "level", "N5",
                                "source", "FLASHCARD",
                                "result", "GOOD"
                        ))))
                .andExpect(status().isOk());

        MvcResult startResult = mockMvc.perform(post("/api/v1/assessment/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "level", "N5",
                                "category", "grammar",
                                "questionCount", 1
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        String sessionId = readJson(startResult).get("sessionId").asText();
        mockMvc.perform(post("/api/v1/assessment/sessions/{sessionId}/submit", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", Map.of("grammar-q-dashboard", "tabemasu")))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/personalization/me/dashboard")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.profile.userId", not(blankOrNullString())))
                .andExpect(jsonPath("$.progress.totalItems").value(3))
                .andExpect(jsonPath("$.progress.weakItems").value(3))
                .andExpect(jsonPath("$.flashcards.totalCards").value(1))
                .andExpect(jsonPath("$.flashcards.dueCards").value(1))
                .andExpect(jsonPath("$.assessments.completedSessions").value(1))
                .andExpect(jsonPath("$.assessments.latest.score").value(0))
                .andExpect(jsonPath("$.assessments.recentWeakAreas[0]").value("grammar-q-dashboard"))
                .andExpect(jsonPath("$.chat.sessionCount").value(1))
                .andExpect(jsonPath("$.chat.messageCount").value(2))
                .andExpect(jsonPath("$.chat.recentTopics[0]").value("grammar"));
    }

    @Test
    void studyFeedbackRequiresJwtAndStoresPilotUserTestData() throws Exception {
        JsonNode authResponse = register(uniqueEmail("feedback"));
        String accessToken = authResponse.get("accessToken").asText();
        Map<String, Object> feedback = Map.ofEntries(
                Map.entry("moment", "QUIZ"),
                Map.entry("contextType", "study_lesson"),
                Map.entry("contextId", "n5-foundation-lesson-1"),
                Map.entry("contextTitle", "N5 first lesson"),
                Map.entry("rating", 4),
                Map.entry("clarityRating", 5),
                Map.entry("trustRating", 4),
                Map.entry("difficultyFit", "JUST_RIGHT"),
                Map.entry("paceChoice", "OK"),
                Map.entry("actionChoice", "MOVE_ON"),
                Map.entry("comment", "Good for beginner")
        );

        mockMvc.perform(post("/api/v1/personalization/me/feedback")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(feedback)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/personalization/me/feedback")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(feedback)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.moment").value("QUIZ"))
                .andExpect(jsonPath("$.contextType").value("study_lesson"))
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.clarityRating").value(5))
                .andExpect(jsonPath("$.trustRating").value(4))
                .andExpect(jsonPath("$.difficultyFit").value("JUST_RIGHT"));

        mockMvc.perform(get("/api/v1/personalization/me/feedback")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].contextId").value("n5-foundation-lesson-1"))
                .andExpect(jsonPath("$[0].actionChoice").value("MOVE_ON"));
    }

    @Test
    void pilotStudyMetricsCaptureLessonSurveyAndAssessmentPairs() throws Exception {
        when(aiServiceClient.generateAssessment(any())).thenReturn(new AiAssessmentGenerateResponse(List.of(
                new AiAssessmentQuestionResponse(
                        "pilot-q1",
                        "Choose the topic particle.",
                        List.of("は", "を"),
                        "は",
                        "は marks the topic."
                )
        )));
        JsonNode authResponse = register(uniqueEmail("pilot-metrics"));
        String accessToken = authResponse.get("accessToken").asText();

        MvcResult attemptResult = mockMvc.perform(post("/api/v1/personalization/me/study-attempts")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "lessonId", "n5-desu-wa",
                                "lessonTitle", "Bai 1",
                                "level", "N5",
                                "chapterId", "n5-foundation",
                                "chapterTitle", "Chapter 1"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.lessonId").value("n5-desu-wa"))
                .andExpect(jsonPath("$.status").value("STARTED"))
                .andReturn();

        String attemptId = readJson(attemptResult).get("id").asText();
        mockMvc.perform(post("/api/v1/personalization/me/study-attempts/{attemptId}/complete", attemptId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "scorePercent", 100,
                                "correctCount", 5,
                                "totalQuestions", 5,
                                "passed", true
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.passed").value(true))
                .andExpect(jsonPath("$.scorePercent").value(100))
                .andExpect(jsonPath("$.durationSeconds").isNumber());

        mockMvc.perform(post("/api/v1/personalization/me/feedback")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "moment", "QUIZ",
                                "contextType", "study_lesson",
                                "contextId", "n5-desu-wa",
                                "contextTitle", "Bai 1",
                                "rating", 4,
                                "difficultyFit", "JUST_RIGHT",
                                "paceChoice", "FAST",
                                "actionChoice", "MOVE_ON",
                                "comment", "Easy to follow"
                        ))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/personalization/me/pilot-surveys")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "contextType", "study_lesson",
                                "contextId", "n5-desu-wa",
                                "contextTitle", "Bai 1",
                                "susScores", List.of(5, 1, 4, 2, 5, 1, 4, 2, 5, 1),
                                "trustRating", 4,
                                "comment", "The path is clear"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.susScore").value(90.0))
                .andExpect(jsonPath("$.trustRating").value(4));

        MvcResult preTest = mockMvc.perform(post("/api/v1/assessment/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "level", "N5",
                                "category", "grammar",
                                "questionCount", 1
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        mockMvc.perform(post("/api/v1/assessment/sessions/{sessionId}/submit", readJson(preTest).get("sessionId").asText())
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", Map.of("pilot-q1", "を")))))
                .andExpect(status().isOk());

        MvcResult postTest = mockMvc.perform(post("/api/v1/assessment/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "level", "N5",
                                "category", "grammar",
                                "questionCount", 1
                        ))))
                .andExpect(status().isOk())
                .andReturn();
        mockMvc.perform(post("/api/v1/assessment/sessions/{sessionId}/submit", readJson(postTest).get("sessionId").asText())
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", Map.of("pilot-q1", "は")))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/personalization/me/metrics")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.learnerCount").value(1))
                .andExpect(jsonPath("$.completedLessonAttempts").value(1))
                .andExpect(jsonPath("$.passedLessonAttempts").value(1))
                .andExpect(jsonPath("$.passRatePercent").value(100.0))
                .andExpect(jsonPath("$.averageLessonScorePercent").value(100.0))
                .andExpect(jsonPath("$.feedbackResponses").value(1))
                .andExpect(jsonPath("$.averageStudyRating").value(4.0))
                .andExpect(jsonPath("$.surveyResponses").value(1))
                .andExpect(jsonPath("$.averageSusScore").value(90.0))
                .andExpect(jsonPath("$.assessmentPairCount").value(1))
                .andExpect(jsonPath("$.averagePreTestScorePercent").value(0.0))
                .andExpect(jsonPath("$.averagePostTestScorePercent").value(100.0))
                .andExpect(jsonPath("$.averageAssessmentGainPercent").value(100.0))
                .andExpect(jsonPath("$.difficultyFitCounts.JUST_RIGHT").value(1))
                .andExpect(jsonPath("$.recentComments[0]").value("The path is clear"));

        mockMvc.perform(get("/api/v1/personalization/pilot-study/metrics")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken)))
                .andExpect(status().isForbidden());

        JsonNode adminResponse = register(uniqueEmail("pilot-admin"));
        String adminAccessToken = adminResponse.get("accessToken").asText();
        userRepository.findById(UUID.fromString(adminResponse.get("user").get("id").asText()))
                .ifPresent(user -> {
                    user.setRole(UserRole.ADMIN);
                    userRepository.save(user);
                });

        mockMvc.perform(get("/api/v1/personalization/pilot-study/metrics")
                        .header(HttpHeaders.AUTHORIZATION, bearer(adminAccessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.completedLessonAttempts", greaterThan(0)))
                .andExpect(jsonPath("$.surveyResponses", greaterThan(0)));
    }

    @Test
    void assessmentSessionStoresAnswerKeyAndUpdatesMasteryOnSubmit() throws Exception {
        when(aiServiceClient.generateAssessment(any())).thenReturn(new AiAssessmentGenerateResponse(List.of(
                new AiAssessmentQuestionResponse(
                        "grammar-q1",
                        "Choose the dictionary form.",
                        List.of("taberu", "tabemasu"),
                        "taberu",
                        "tabemasu is the polite form; taberu is the dictionary form."
                )
        )));
        JsonNode authResponse = register(uniqueEmail("assessment"));
        String accessToken = authResponse.get("accessToken").asText();

        Map<String, Object> startRequest = Map.of(
                "level", "N5",
                "category", "grammar",
                "questionCount", 1
        );
        mockMvc.perform(post("/api/v1/assessment/sessions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(startRequest)))
                .andExpect(status().isUnauthorized());

        MvcResult startResult = mockMvc.perform(post("/api/v1/assessment/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(startRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", not(blankOrNullString())))
                .andExpect(jsonPath("$.questions[0].id").value("grammar-q1"))
                .andExpect(jsonPath("$.questions[0].answer").doesNotExist())
                .andReturn();

        String sessionId = readJson(startResult).get("sessionId").asText();
        mockMvc.perform(post("/api/v1/assessment/sessions/{sessionId}/submit", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", Map.of("grammar-q1", "taberu")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.score").value(1))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.results[0].correct").value(true))
                .andExpect(jsonPath("$.results[0].correctAnswer").value("taberu"))
                .andExpect(jsonPath("$.progress[0].knowledgeType").value("GrammarPoint"))
                .andExpect(jsonPath("$.progress[0].knowledgeId").value("grammar-q1"))
                .andExpect(jsonPath("$.progress[0].masteryScore").value(0.08));

        mockMvc.perform(post("/api/v1/assessment/sessions/{sessionId}/submit", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearer(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("answers", Map.of("grammar-q1", "taberu")))))
                .andExpect(status().isBadRequest());
    }

    private JsonNode register(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "email", email,
                                "password", PASSWORD,
                                "displayName", "Integration Test",
                                "avatarUrl", "https://cdn.example.com/avatar.png"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.refreshToken", not(blankOrNullString())))
                .andExpect(jsonPath("$.expiresIn").value(480))
                .andExpect(jsonPath("$.user.email").value(email))
                .andReturn();
        return readJson(result);
    }

    private JsonNode readJson(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsByteArray());
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }

    private String uniqueEmail(String prefix) {
        return prefix + "-" + System.nanoTime() + "@example.com";
    }

    private String bearer(String accessToken) {
        return "Bearer " + accessToken;
    }
}
