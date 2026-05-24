package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.FlashcardDeckCreateRequest;
import com.jpassistant.application.dto.request.FlashcardReviewRequest;
import com.jpassistant.application.dto.response.FlashcardCardResponse;
import com.jpassistant.application.dto.response.FlashcardDeckResponse;
import com.jpassistant.application.dto.response.FlashcardReviewResponse;
import java.util.List;
import java.util.UUID;

public interface FlashcardService {

    List<FlashcardDeckResponse> listDecks(String userId);

    FlashcardDeckResponse createDeck(String userId, FlashcardDeckCreateRequest request);

    List<FlashcardCardResponse> listCards(String userId, UUID deckId);

    List<FlashcardCardResponse> listDueCards(String userId, Integer limit);

    FlashcardReviewResponse recordReview(String userId, FlashcardReviewRequest request);
}
