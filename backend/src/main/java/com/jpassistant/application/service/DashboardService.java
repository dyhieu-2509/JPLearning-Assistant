package com.jpassistant.application.service;

import com.jpassistant.application.dto.response.LearnerDashboardResponse;

public interface DashboardService {

    LearnerDashboardResponse getLearnerDashboard(String userId);
}
