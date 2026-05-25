package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.request.PlannerRecommendRequest;
import com.jpassistant.application.dto.response.PlannerRecommendationResponse;
import com.jpassistant.application.dto.response.SavedStudyPlanResponse;
import com.jpassistant.application.service.PlannerService;
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
@RequestMapping("/api/v1/planner")
public class PlannerController {

    private final PlannerService plannerService;

    public PlannerController(PlannerService plannerService) {
        this.plannerService = plannerService;
    }

    @PostMapping("/recommend")
    public PlannerRecommendationResponse recommend(
            @Valid @RequestBody(required = false) PlannerRecommendRequest request,
            Authentication authentication
    ) {
        return plannerService.recommend(authentication.getName(), request);
    }

    @GetMapping("/plans")
    public List<SavedStudyPlanResponse> listPlans(
            @RequestParam(required = false) Integer limit,
            Authentication authentication
    ) {
        return plannerService.listPlans(authentication.getName(), limit);
    }

    @GetMapping("/plans/{planId}")
    public SavedStudyPlanResponse getPlan(
            @PathVariable UUID planId,
            Authentication authentication
    ) {
        return plannerService.getPlan(authentication.getName(), planId);
    }

    @PostMapping("/plans/{planId}/items/{itemId}/complete")
    public SavedStudyPlanResponse completePlanItem(
            @PathVariable UUID planId,
            @PathVariable UUID itemId,
            Authentication authentication
    ) {
        return plannerService.completePlanItem(authentication.getName(), planId, itemId);
    }
}
