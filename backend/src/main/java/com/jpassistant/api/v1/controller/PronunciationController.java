package com.jpassistant.api.v1.controller;

import com.jpassistant.application.dto.response.PronunciationScoreResponse;
import com.jpassistant.application.service.PronunciationService;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/pronunciation")
public class PronunciationController {

    private final PronunciationService pronunciationService;

    public PronunciationController(PronunciationService pronunciationService) {
        this.pronunciationService = pronunciationService;
    }

    @PostMapping(value = "/score", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public PronunciationScoreResponse score(
            @RequestPart("audio") MultipartFile audio,
            @RequestParam String targetText,
            @RequestParam String lessonId,
            @RequestParam(required = false) String lessonTitle,
            @RequestParam String taskId,
            @RequestParam(required = false) String taskTitle,
            @RequestParam(defaultValue = "N5") String level,
            Authentication authentication
    ) {
        return pronunciationService.scorePronunciation(
                authentication.getName(),
                audio,
                targetText,
                lessonId,
                lessonTitle,
                taskId,
                taskTitle,
                level
        );
    }
}
