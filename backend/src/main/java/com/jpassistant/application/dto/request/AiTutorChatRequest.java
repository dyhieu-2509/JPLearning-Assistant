package com.jpassistant.application.dto.request;

import com.jpassistant.application.dto.response.KnowledgeProgressResponse;
import com.jpassistant.application.dto.response.StudentProfileResponse;
import java.util.List;

public record AiTutorChatRequest(
        String message,
        String userId,
        String contextTopic,
        StudentProfileResponse profile,
        List<KnowledgeProgressResponse> weakProgress
) {
}
