package com.example.springbackend.security;

/** Google OAuth2 プロバイダーから利用者作成に使うクレームを受け渡します。 */
public record GoogleUserClaims(String subject, String email, String displayName) {
}
