package com.example.springbackend.activity;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** セッション内の 1 区間を編集する API 入力です。 */
public record SessionSegmentUpdateRequest(
        @NotNull SegmentType segmentType,
        @NotNull Instant startedAt,
        Instant endedAt,
        @Positive Long plannedDurationSeconds) {
}
