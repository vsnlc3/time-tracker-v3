package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record TimedManualSessionRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull SegmentType segmentType,
        Instant startedAt,
        Instant endedAt,
        @Positive Long durationSeconds) {
}
