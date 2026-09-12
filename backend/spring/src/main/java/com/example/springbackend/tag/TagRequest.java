package com.example.springbackend.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record TagRequest(
        @NotBlank
        @Size(max = 255)
        String displayName,
        @Size(max = 32)
        String color) {
}
