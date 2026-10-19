package com.example.springbackend.user;

/** API で公開する利用者情報です。永続化用の Google subject は含めません。 */
public record UserResponse(Long id, String displayName, String email) {

    /** エンティティから API 応答を作成します。 */
    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getDisplayName(), user.getEmail());
    }
}
