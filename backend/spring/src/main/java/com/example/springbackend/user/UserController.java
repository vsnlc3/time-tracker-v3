package com.example.springbackend.user;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.springbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final CurrentUserService currentUserService;

    public UserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    public UserResponse me() {
        return UserResponse.from(currentUserService.requireCurrentUser());
    }
}
