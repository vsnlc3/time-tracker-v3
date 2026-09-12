package com.example.springbackend.activity;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SessionSegmentUpdateRequest(
        @NotNull SegmentType segmentType,
        @NotNull Instant startedAt,
        Instant endedAt,
        @Positive Long plannedDurationSeconds) {
}
