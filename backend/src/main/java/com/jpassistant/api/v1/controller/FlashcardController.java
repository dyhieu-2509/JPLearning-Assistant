package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.FlashcardDeckCreateRequest;
import com.jpassistant.application.dto.request.FlashcardReviewRequest;
import com.jpassistant.application.dto.response.FlashcardCardResponse;
import com.jpassistant.application.dto.response.FlashcardDeckResponse;
import com.jpassistant.application.dto.response.FlashcardReviewResponse;
import com.jpassistant.application.service.FlashcardService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/flashcards")
public class FlashcardController {

    private final FlashcardService flashcardService;

    public FlashcardController(FlashcardService flashcardService) {
        this.flashcardService = flashcardService;
    }

    @GetMapping("/decks")
    public List<FlashcardDeckResponse> listDecks(Authentication authentication) {
        return flashcardService.listDecks(authentication.getName());
    }

    @PostMapping("/decks")
    public FlashcardDeckResponse createDeck(
            @Valid @RequestBody FlashcardDeckCreateRequest request,
            Authentication authentication
    ) {
        return flashcardService.createDeck(authentication.getName(), request);
    }

    @GetMapping("/decks/{deckId}/cards")
    public List<FlashcardCardResponse> listCards(
            @PathVariable UUID deckId,
            Authentication authentication
    ) {
        return flashcardService.listCards(authentication.getName(), deckId);
    }

    @GetMapping("/review/due")
    public List<FlashcardCardResponse> listDueCards(
            @RequestParam(required = false) Integer limit,
            Authentication authentication
    ) {
        return flashcardService.listDueCards(authentication.getName(), limit);
    }

    @PostMapping("/review")
    public FlashcardReviewResponse recordReview(
            @Valid @RequestBody FlashcardReviewRequest request,
            Authentication authentication
    ) {
        return flashcardService.recordReview(authentication.getName(), request);
    }
}
