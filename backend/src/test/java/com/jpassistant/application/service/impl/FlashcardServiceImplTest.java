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

    @Test
    void listDecksSeedsStarterDecksForNewLearner() {
        List<FlashcardDeck> decks = new java.util.ArrayList<>();
        when(deckRepository.findByUserIdOrderByUpdatedAtDesc("user-1")).thenReturn(decks);
        when(deckRepository.save(org.mockito.Mockito.any(FlashcardDeck.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(cardRepository.countByDeckId(org.mockito.Mockito.any())).thenReturn(8L);
        when(knowledgeGraphRepository.searchVocabulary("", "N5", 8)).thenReturn(List.of(starterItem("Vocabulary", "taberu:N5", "食べる", "eat", "N5")));
        when(knowledgeGraphRepository.searchGrammar("", "N5", 8)).thenReturn(List.of(starterItem("GrammarPoint", "desu:N5", "です", "to be", "N5")));
        when(knowledgeGraphRepository.searchKanji("", "N5", 8)).thenReturn(List.of(starterItem("Kanji", "日", "日", "sun", "N5")));
        when(knowledgeGraphRepository.searchVocabulary("", "N4", 8)).thenReturn(List.of(starterItem("Vocabulary", "kaigi:N4", "会議", "meeting", "N4")));
        when(knowledgeGraphRepository.searchGrammar("", "N4", 8)).thenReturn(List.of(starterItem("GrammarPoint", "node:N4", "ので", "because", "N4")));
        when(knowledgeGraphRepository.searchKanji("", "N4", 8)).thenReturn(List.of(starterItem("Kanji", "会", "会", "meeting", "N4")));

        var response = service.listDecks("user-1");

        assertThat(response).hasSize(6);
        assertThat(response).extracting("level").contains("N5", "N4");
        assertThat(response).extracting("category").contains("vocabulary", "grammar", "kanji");
        verify(cardRepository, org.mockito.Mockito.times(6)).saveAll(org.mockito.Mockito.any());
    }

    private KnowledgeItem starterItem(String type, String id, String title, String meaning, String level) {
        return new KnowledgeItem(type, id, title, title, meaning, meaning, level, "seed");
    }
}
