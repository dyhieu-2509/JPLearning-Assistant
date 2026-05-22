package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.service.PersonalizationService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/personalization")
public class PersonalizationController {

    private final PersonalizationService personalizationService;

    public PersonalizationController(PersonalizationService personalizationService) {
        this.personalizationService = personalizationService;
    }

    @GetMapping("/me/profile")
    public StudentProfileResponse getProfile(Authentication authentication) {
        return personalizationService.getOrCreateProfile(authenticatedUserId(authentication));
    }

    @PutMapping("/me/profile")
    public StudentProfileResponse updateProfile(
            @Valid @RequestBody StudentProfileRequest request,
            Authentication authentication
    ) {
        return personalizationService.updateProfile(authenticatedUserId(authentication), request);
    }

    @GetMapping("/me/progress")
    public List<KnowledgeProgressResponse> getProgress(
            @RequestParam(defaultValue = "false") boolean weakOnly,
            @RequestParam(defaultValue = "20") Integer limit,
            Authentication authentication
    ) {
        return personalizationService.getProgress(authenticatedUserId(authentication), weakOnly, limit);
    }

    @PostMapping("/me/progress/exposures")
    public KnowledgeProgressResponse recordExposure(
            @Valid @RequestBody KnowledgeProgressRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordExposure(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/progress/reviews")
    public KnowledgeProgressResponse recordReview(
            @Valid @RequestBody KnowledgeReviewRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordReview(authenticatedUserId(authentication), request);
    }

    @PostMapping("/me/progress/signals")
    public KnowledgeProgressResponse recordLearningSignal(
            @Valid @RequestBody LearningSignalRequest request,
            Authentication authentication
    ) {
        return personalizationService.recordLearningSignal(authenticatedUserId(authentication), request);
    }

    private String authenticatedUserId(Authentication authentication) {
        return authentication.getName();
    }
}
