package com.example.springbackend.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** タグ作成・更新 API の入力です。色を省略した場合はサービス側で既定色を使います。 */
public record TagRequest(
        @NotBlank
        @Size(max = 255)
        String displayName,
        @Size(max = 32)
        String color) {
}
