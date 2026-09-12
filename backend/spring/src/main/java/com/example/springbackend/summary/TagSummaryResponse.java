package com.example.springbackend.summary;

public record TagSummaryResponse(
        Long tagId,
        String tagDisplayName,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds) {
}
