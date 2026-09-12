package com.example.springbackend.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.security.GoogleUserClaims;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    public User findOrCreateFromGoogle(GoogleUserClaims claims) {
        return userRepository.findByGoogleSubject(claims.subject())
                .map(user -> {
                    user.updateProfile(claims.email(), claims.displayName());
                    return user;
                })
                .orElseGet(() -> userRepository.save(
                        new User(claims.subject(), claims.email(), claims.displayName())));
    }
}
