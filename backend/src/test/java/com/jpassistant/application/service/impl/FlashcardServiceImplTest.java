package com.jpassistant.application.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.jpassistant.application.dto.request.FlashcardDeckCreateRequest;
import com.jpassistant.application.dto.request.FlashcardReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.service.PersonalizationService;
import com.jpassistant.domain.flashcard.FlashcardDeck;
import com.jpassistant.domain.knowledge.KnowledgeGraphRepository;
import com.jpassistant.domain.knowledge.KnowledgeItem;
import com.jpassistant.domain.personalization.LearningSignalResult;
import com.jpassistant.domain.personalization.LearningSignalSource;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardCardJpaRepository;
import com.jpassistant.infrastructure.persistence.jpa.FlashcardDeckJpaRepository;
import java.util.List;
import org.junit.jupiter.api.Test;

class FlashcardServiceImplTest {

    private final PersonalizationService personalizationService = org.mockito.Mockito.mock(
            PersonalizationService.class
    );
    private final FlashcardDeckJpaRepository deckRepository = org.mockito.Mockito.mock(
            FlashcardDeckJpaRepository.class
    );
    private final FlashcardCardJpaRepository cardRepository = org.mockito.Mockito.mock(
            FlashcardCardJpaRepository.class
    );
    private final KnowledgeGraphRepository knowledgeGraphRepository = org.mockito.Mockito.mock(
            KnowledgeGraphRepository.class
    );
    private final FlashcardServiceImpl service = new FlashcardServiceImpl(
            personalizationService,
            deckRepository,
            cardRepository,
            knowledgeGraphRepository
    );

    @Test
    void recordReviewMapsFlashcardRatingToLearningSignal() {
        service.recordReview(
                "user-1",
                new FlashcardReviewRequest("Vocabulary", "tabemasu:N5", "tabemasu", "N5", LearningSignalResult.GOOD)
        );

        verify(personalizationService).recordLearningSignal(
                "user-1",
                new LearningSignalRequest(
                        "Vocabulary",
                        "tabemasu:N5",
                        "tabemasu",
                        "N5",
                        LearningSignalSource.FLASHCARD,
                        LearningSignalResult.GOOD
                )
        );
    }

    @Test
    void createDeckAutoGeneratesCardsFromKnowledgeGraph() {
        when(deckRepository.save(org.mockito.Mockito.any(FlashcardDeck.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(knowledgeGraphRepository.searchVocabulary("", "N5", 2)).thenReturn(List.of(
                new KnowledgeItem(
                        "Vocabulary",
                        "tabemasu:N5",
                        "tabemasu",
                        "tabemasu",
                        "an",
                        "eat",
                        "N5",
                        "seed"
                )
        ));

        service.createDeck(
                "user-1",
                new FlashcardDeckCreateRequest("N5 vocab", "N5", "vocabulary", true, 2, null)
        );

        verify(cardRepository).saveAll(org.mockito.Mockito.argThat(cards -> {
            List<?> savedCards = (List<?>) cards;
            assertThat(savedCards).hasSize(1);
            return true;
        }));
    }
}
