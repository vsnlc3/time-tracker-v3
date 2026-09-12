package com.example.springbackend.activity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record SegmentSwitchRequest(
        @NotNull SegmentType segmentType,
        @Positive Long plannedDurationSeconds) {
}
