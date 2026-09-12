package com.example.springbackend.activity;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record StartActivitySessionRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull SegmentType initialSegmentType,
        @Positive Long segmentPlannedDurationSeconds,
        @Positive Long plannedDurationSeconds,
        java.time.Instant plannedEndAt) {
}
