package com.example.springbackend.auth;

import java.util.Map;

import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
/** 認証フローに関連する、フロントエンド向けのエンドポイントを提供します。 */
public class AuthController {

    @GetMapping("/csrf")
    /** Cookie と併用する CSRF トークンを返し、状態変更リクエストを保護します。 */
    public Map<String, String> csrf(CsrfToken csrfToken) {
        return Map.of("token", csrfToken.getToken());
    }
}
