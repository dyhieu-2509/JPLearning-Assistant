package com.jpassistant.application.service.impl;

import com.jpassistant.application.dto.request.FlashcardCardCreateRequest;
import com.jpassistant.application.dto.request.FlashcardDeckCreateRequest;
import com.jpassistant.application.dto.request.FlashcardReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.response.FlashcardCardResponse;
import com.jpassistant.application.dto.response.FlashcardDeckResponse;
import com.jpassistant.application.dto.response.FlashcardReviewResponse;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.exception.InvalidRequestException;
import com.jpassistant.application.service.FlashcardService;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.flashcard.FlashcardCard;
import com.jpassistant.domain.flashcard.FlashcardDeck;
import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardCardJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardDeckJpaRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.EnumSet;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FlashcardServiceImpl implements FlashcardService {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 100;
    private static final int STARTER_DECK_LIMIT = 8;
    private static final List<StarterDeckSpec> STARTER_DECKS = List.of(
            new StarterDeckSpec("N5", "vocabulary", "N5 - Từ vựng nhập môn"),
            new StarterDeckSpec("N5", "grammar", "N5 - Mẫu câu cơ bản"),
            new StarterDeckSpec("N5", "kanji", "N5 - Kanji cơ bản"),
            new StarterDeckSpec("N4", "vocabulary", "N4 - Từ vựng ôn tiếp"),
            new StarterDeckSpec("N4", "grammar", "N4 - Mẫu câu ôn tiếp"),
            new StarterDeckSpec("N4", "kanji", "N4 - Kanji ôn tiếp")
    );

    private final PersonalizationService personalizationService;
    private final FlashcardDeckJpaRepository deckRepository;
    private final FlashcardCardJpaRepository cardRepository;
    private final KnowledgeGraphRepository knowledgeGraphRepository;

    public FlashcardServiceImpl(
            PersonalizationService personalizationService,
            FlashcardDeckJpaRepository deckRepository,
            FlashcardCardJpaRepository cardRepository,
            KnowledgeGraphRepository knowledgeGraphRepository
    ) {
        this.personalizationService = personalizationService;
        this.deckRepository = deckRepository;
        this.cardRepository = cardRepository;
        this.knowledgeGraphRepository = knowledgeGraphRepository;
    }

    @Override
    @Transactional
    public List<FlashcardDeckResponse> listDecks(String userId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        List<FlashcardDeck> existingDecks = deckRepository.findByUserIdOrderByUpdatedAtDesc(normalizedUserId);
        ensureStarterDecks(normalizedUserId, existingDecks);
        return deckRepository.findByUserIdOrderByUpdatedAtDesc(normalizedUserId)
                .stream()
                .map(this::toDeckResponse)
                .toList();
    }

    @Override
    @Transactional
    public FlashcardDeckResponse createDeck(String userId, FlashcardDeckCreateRequest request) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        String level = normalizeLevel(request.level(), "N5");
        String category = normalizeCategory(request.category(), "vocabulary");
        String title = defaultText(request.title(), level + " " + category + " deck");
        int limit = normalizeLimit(request.limit());

        FlashcardDeck deck = deckRepository.save(new FlashcardDeck(normalizedUserId, title, level, category));
        List<FlashcardCard> cards = new ArrayList<>();
        if (Boolean.TRUE.equals(request.autoGenerate())) {
            cards.addAll(generateCardsFromKnowledgeGraph(deck, category, level, limit));
        }
        if (request.cards() != null) {
            for (FlashcardCardCreateRequest cardRequest : request.cards()) {
                cards.add(toManualCard(deck, cardRequest));
            }
        }
        if (cards.isEmpty()) {
            throw new InvalidRequestException("deck requires cards or autoGenerate=true");
        }
        cardRepository.saveAll(cards);
        deck.touch();
        return toDeckResponse(deckRepository.save(deck));
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardCardResponse> listCards(String userId, UUID deckId) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        requireDeck(deckId, normalizedUserId);
        return cardRepository.findByDeckIdAndDeckUserIdOrderByCreatedAtAsc(deckId, normalizedUserId)
                .stream()
                .map(this::toCardResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<FlashcardCardResponse> listDueCards(String userId, Integer limit) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        return cardRepository.findByDeckUserIdAndNextReviewAtLessThanEqualOrderByNextReviewAtAsc(
                        normalizedUserId,
                        Instant.now(),
                        PageRequest.of(0, normalizeLimit(limit))
                )
                .stream()
                .map(this::toCardResponse)
                .toList();
    }

    @Override
    @Transactional
    public FlashcardReviewResponse recordReview(String userId, FlashcardReviewRequest request) {
        String normalizedUserId = normalizeRequired(userId, "userId");
        validateFlashcardRating(request.rating());
        if (request.cardId() != null) {
            FlashcardCard card = cardRepository.findByIdAndDeckUserId(request.cardId(), normalizedUserId)
                    .orElseThrow(() -> new InvalidRequestException("flashcard card was not found"));
            card.recordReview(request.rating());
            KnowledgeProgressResponse progress = recordProgressSignal(normalizedUserId, card, request.rating());
            return new FlashcardReviewResponse(toCardResponse(cardRepository.save(card)), progress);
        }
        KnowledgeProgressResponse progress = recordProgressSignal(normalizedUserId, request);
        return new FlashcardReviewResponse(null, progress);
    }

    private List<FlashcardCard> generateCardsFromKnowledgeGraph(
            FlashcardDeck deck,
            String category,
            String level,
            int limit
    ) {
        List<KnowledgeItem> items = switch (category.toLowerCase(Locale.ROOT)) {
            case "vocabulary", "vocab" -> knowledgeGraphRepository.searchVocabulary("", level, limit);
            case "grammar" -> knowledgeGraphRepository.searchGrammar("", level, limit);
            case "kanji" -> knowledgeGraphRepository.searchKanji("", level, limit);
            default -> throw new InvalidRequestException(
                    "autoGenerate category must be vocabulary, grammar, or kanji"
            );
        };
        if (items.isEmpty()) {
            throw new InvalidRequestException("knowledge graph returned no flashcard candidates");
        }
        return items.stream().map(item -> new FlashcardCard(
                deck,
                normalizeRequired(firstNonBlank(item.title(), item.reading(), item.id()), "frontText"),
                normalizeRequired(firstNonBlank(item.meaningVi(), item.meaningEn(), item.source()), "backText"),
                optionalText(item.reading()),
                defaultText(item.type(), knowledgeType(category)),
                defaultText(item.id(), firstNonBlank(item.title(), item.reading())),
                normalizeLevel(item.level(), level)
        )).toList();
    }

    private FlashcardCard toManualCard(FlashcardDeck deck, FlashcardCardCreateRequest request) {
        String frontText = normalizeRequired(request.frontText(), "frontText");
        String backText = normalizeRequired(request.backText(), "backText");
        String sourceType = defaultText(request.sourceType(), knowledgeType(deck.getCategory()));
        String sourceId = defaultText(request.sourceId(), frontText);
        String level = normalizeLevel(request.level(), deck.getLevel());
        return new FlashcardCard(
                deck,
                frontText,
                backText,
                optionalText(request.reading()),
                sourceType,
                sourceId,
                level
        );
    }

    private FlashcardDeck requireDeck(UUID deckId, String userId) {
        if (deckId == null) {
            throw new InvalidRequestException("deckId is required");
        }
        return deckRepository.findByIdAndUserId(deckId, userId)
                .orElseThrow(() -> new InvalidRequestException("flashcard deck was not found"));
    }

    private KnowledgeProgressResponse recordProgressSignal(
            String userId,
            FlashcardCard card,
            LearningSignalResult rating
    ) {
        return personalizationService.recordLearningSignal(userId, new LearningSignalRequest(
                card.getSourceType(),
                card.getSourceId(),
                card.getFrontText(),
                card.getLevel(),
                LearningSignalSource.FLASHCARD,
                rating
        ));
    }

    private KnowledgeProgressResponse recordProgressSignal(String userId, FlashcardReviewRequest request) {
        return personalizationService.recordLearningSignal(userId, new LearningSignalRequest(
                normalizeRequired(request.knowledgeType(), "knowledgeType"),
                normalizeRequired(request.knowledgeId(), "knowledgeId"),
                request.title(),
                request.level(),
                LearningSignalSource.FLASHCARD,
                request.rating()
        ));
    }

    private void ensureStarterDecks(String userId, List<FlashcardDeck> existingDecks) {
        for (StarterDeckSpec starterDeck : STARTER_DECKS) {
            if (hasDeck(existingDecks, starterDeck.level(), starterDeck.category())) {
                continue;
            }
            try {
                FlashcardDeck deck = deckRepository.save(new FlashcardDeck(
                        userId,
                        starterDeck.title(),
                        starterDeck.level(),
                        starterDeck.category()
                ));
                List<FlashcardCard> cards = generateCardsFromKnowledgeGraph(
                        deck,
                        starterDeck.category(),
                        starterDeck.level(),
                        STARTER_DECK_LIMIT
                );
                if (!cards.isEmpty()) {
                    cardRepository.saveAll(cards);
                    deck.touch();
                    existingDecks.add(deckRepository.save(deck));
                }
            } catch (InvalidRequestException ignored) {
                // Starter decks are optional. Do not break the flashcard page if a KG slice is empty.
            }
        }
    }

    private boolean hasDeck(List<FlashcardDeck> decks, String level, String category) {
        return decks.stream().anyMatch(deck ->
                level.equalsIgnoreCase(deck.getLevel()) && category.equalsIgnoreCase(deck.getCategory())
        );
    }

    private void validateFlashcardRating(LearningSignalResult rating) {
        if (!EnumSet.of(
                LearningSignalResult.AGAIN,
                LearningSignalResult.HARD,
                LearningSignalResult.GOOD,
                LearningSignalResult.EASY
        ).contains(rating)) {
            throw new InvalidRequestException("flashcard rating must be AGAIN, HARD, GOOD, or EASY");
        }
    }

    private String knowledgeType(String category) {
        return switch (category.toLowerCase(Locale.ROOT)) {
            case "vocabulary", "vocab" -> "Vocabulary";
            case "grammar" -> "GrammarPoint";
            case "kanji" -> "Kanji";
            default -> "Flashcard";
        };
    }

    private FlashcardDeckResponse toDeckResponse(FlashcardDeck deck) {
        return new FlashcardDeckResponse(
                deck.getId(),
                deck.getTitle(),
                deck.getLevel(),
                deck.getCategory(),
                cardRepository.countByDeckId(deck.getId()),
                deck.getCreatedAt(),
                deck.getUpdatedAt()
        );
    }

    private FlashcardCardResponse toCardResponse(FlashcardCard card) {
        return new FlashcardCardResponse(
                card.getId(),
                card.getDeck().getId(),
                card.getFrontText(),
                card.getBackText(),
                card.getReading(),
                card.getSourceType(),
                card.getSourceId(),
                card.getLevel(),
                card.getEasinessFactor(),
                card.getIntervalDays(),
                card.getRepetitions(),
                card.getNextReviewAt(),
                card.getLastReviewedAt()
        );
    }

    private String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new InvalidRequestException(field + " is required");
        }
        return value.trim();
    }

    private String normalizeLevel(String level, String defaultLevel) {
        return MvpLearningLevels.normalize(level, defaultLevel);
    }

    private String normalizeCategory(String category, String defaultCategory) {
        String normalized = category == null || category.isBlank()
                ? defaultCategory
                : category.trim().toLowerCase(Locale.ROOT);
        if (!normalized.matches("[a-z0-9_-]{1,50}")) {
            throw new InvalidRequestException("category must contain only letters, numbers, underscore, or hyphen");
        }
        return normalized;
    }

    private int normalizeLimit(Integer limit) {
        if (limit == null) {
            return DEFAULT_LIMIT;
        }
        return Math.min(Math.max(limit, 1), MAX_LIMIT);
    }

    private String defaultText(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String firstNonBlank(String first, String second) {
        if (first != null && !first.isBlank()) {
            return first;
        }
        return second;
    }

    private String firstNonBlank(String first, String second, String third) {
        String value = firstNonBlank(first, second);
        if (value != null && !value.isBlank()) {
            return value;
        }
        return third;
    }

    private record StarterDeckSpec(String level, String category, String title) {
    }
}
