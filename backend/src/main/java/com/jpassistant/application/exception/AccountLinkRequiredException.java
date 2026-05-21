package com.jpassistant.application.exception;

public class AccountLinkRequiredException extends RuntimeException {

    private final String email;

    /**
     * Creates an exception when an OAuth account must be linked explicitly.
     *
     * @param email verified provider email that matches an existing local account
     */
    public AccountLinkRequiredException(String email) {
        super("account link confirmation is required for " + email);
        this.email = email;
    }

    public String email() {
        return email;
    }
}
