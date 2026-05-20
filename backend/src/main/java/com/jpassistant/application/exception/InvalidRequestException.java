package com.jpassistant.application.exception;

public class InvalidRequestException extends RuntimeException {

    /**
     * Creates an exception for invalid API input.
     *
     * @param message human-readable validation message
     */
    public InvalidRequestException(String message) {
        super(message);
    }
}
