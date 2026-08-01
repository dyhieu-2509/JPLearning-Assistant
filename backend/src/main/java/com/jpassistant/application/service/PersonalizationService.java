package com.jpassistant.application.service;

import com.jpassistant.application.dto.request.KnowledgeProgressRequest;
import com.jpassistant.application.dto.request.KnowledgeReviewRequest;
import com.jpassistant.application.dto.request.LearningSignalRequest;
import com.jpassistant.application.dto.request.StudentProfileRequest;
import com.jpassistant.application.dto.request.StudyFeedbackRequest;
import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import com.jpassistant.application.dto.response.StudyFeedbackResponse;
import java.util.List;

public interface PersonalizationService {

    StudentProfileResponse getOrCreateProfile(String userId);

    StudentProfileResponse updateProfile(String userId, StudentProfileRequest request);

    List<KnowledgeProgressResponse> getProgress(String userId, boolean weakOnly, Integer limit);

    KnowledgeProgressResponse recordExposure(String userId, KnowledgeProgressRequest request);

    KnowledgeProgressResponse recordReview(String userId, KnowledgeReviewRequest request);

    KnowledgeProgressResponse recordLearningSignal(String userId, LearningSignalRequest request);

    StudyFeedbackResponse recordStudyFeedback(String userId, StudyFeedbackRequest request);

    List<StudyFeedbackResponse> getStudyFeedback(String userId, Integer limit);
}
