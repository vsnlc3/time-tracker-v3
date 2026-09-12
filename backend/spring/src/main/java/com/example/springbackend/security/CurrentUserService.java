package com.example.springbackend.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.example.springbackend.common.exception.UnauthorizedException;
import com.example.springbackend.user.User;
import com.example.springbackend.user.UserService;

@Service
public class CurrentUserService {

    private final UserService userService;

    public CurrentUserService(UserService userService) {
        this.userService = userService;
    }

    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof OAuth2User oauth2User)) {
            throw new UnauthorizedException("Authentication is required");
        }

        String subject = oauth2User.getAttribute("sub");
        String email = oauth2User.getAttribute("email");
        String displayName = oauth2User.getAttribute("name");
        if (isBlank(subject) || isBlank(email) || isBlank(displayName)) {
            throw new UnauthorizedException("Required Google claims are missing");
        }

        return userService.findOrCreateFromGoogle(new GoogleUserClaims(subject, email, displayName));
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
