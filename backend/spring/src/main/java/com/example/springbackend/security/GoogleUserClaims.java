package com.example.springbackend.security;

public record GoogleUserClaims(String subject, String email, String displayName) {
}
