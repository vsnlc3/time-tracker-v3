package com.example.springbackend.user;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.springbackend.security.CurrentUserService;

@RestController
@RequestMapping("/api/users")
/** ログイン利用者に関する HTTP エンドポイントを提供します。 */
public class UserController {

    private final CurrentUserService currentUserService;

    public UserController(CurrentUserService currentUserService) {
        this.currentUserService = currentUserService;
    }

    @GetMapping("/me")
    /** 現在の利用者情報を画面表示用の応答形式で返します。 */
    public UserResponse me() {
        return UserResponse.from(currentUserService.requireCurrentUser());
    }
}
