package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.PlannerRecommendRequest;
import com.jpassistant.application.dto.response.PlannerRecommendationResponse;
import com.jpassistant.application.dto.response.SavedStudyPlanResponse;
import java.util.List;
import java.util.UUID;

public interface PlannerService {

    PlannerRecommendationResponse recommend(String userId, PlannerRecommendRequest request);

    List<SavedStudyPlanResponse> listPlans(String userId, Integer limit);

    SavedStudyPlanResponse getPlan(String userId, UUID planId);

    SavedStudyPlanResponse completePlanItem(String userId, UUID planId, UUID itemId);
}
