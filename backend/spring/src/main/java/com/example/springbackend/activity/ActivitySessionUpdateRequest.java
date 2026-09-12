package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record ActivitySessionUpdateRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull Instant startedAt,
        Instant endedAt,
        @Positive Long plannedDurationSeconds,
        Instant plannedEndAt) {
}
