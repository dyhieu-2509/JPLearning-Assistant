package com.jpassistant.api.v1;

import com.jpassistant.application.dto.ApiErrorResponse;
import com.jpassistant.application.service.InvalidRequestException;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.reactive.function.client.WebClientException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * Handles validation and domain input errors.
     *
     * @param ex invalid request exception
     * @param request servlet request
     * @return structured error response
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<ApiErrorResponse> handleInvalidRequest(
            InvalidRequestException ex,
            HttpServletRequest request
    ) {
        return error(HttpStatus.BAD_REQUEST, ex.getMessage(), request);
    }

    /**
     * Handles bean validation errors.
     *
     * @param ex validation exception
     * @param request servlet request
     * @return structured error response
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleValidation(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        String message = ex.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getField() + " " + error.getDefaultMessage())
                .orElse("request validation failed");
        return error(HttpStatus.BAD_REQUEST, message, request);
    }

    /**
     * Handles unavailable downstream AI service responses.
     *
     * @param ex downstream client exception
     * @param request servlet request
     * @return structured error response
     */
    @ExceptionHandler(WebClientException.class)
    public ResponseEntity<ApiErrorResponse> handleWebClient(
            WebClientException ex,
            HttpServletRequest request
    ) {
        return error(HttpStatus.BAD_GATEWAY, "AI service is unavailable: " + ex.getMessage(), request);
    }

    private ResponseEntity<ApiErrorResponse> error(HttpStatus status, String message, HttpServletRequest request) {
        return ResponseEntity.status(status).body(new ApiErrorResponse(
                Instant.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                request.getRequestURI()
        ));
    }
}
