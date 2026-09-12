package com.example.springbackend.user;

public record UserResponse(Long id, String displayName, String email) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getDisplayName(), user.getEmail());
    }
}
