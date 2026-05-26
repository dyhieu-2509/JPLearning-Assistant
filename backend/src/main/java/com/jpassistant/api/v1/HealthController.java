package com.jpassistant.api.v1;

import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/health")
public class HealthController {

    /**
     * Returns backend liveness information.
     *
     * @return health payload
     */
    @GetMapping
    public Map<String, String> health() {
        return Map.of("status", "ok", "service", "backend");
    }
}
