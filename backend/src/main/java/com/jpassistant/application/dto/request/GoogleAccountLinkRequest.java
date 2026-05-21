package com.jpassistant.application.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record GoogleAccountLinkRequest(
        @NotBlank String linkToken,
        @NotBlank @Size(max = 100) String password
) {
}
