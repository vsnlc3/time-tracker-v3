package com.example.springbackend.manual;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record ManualTimeEntryRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @Positive Long totalSeconds,
        @PositiveOrZero Long focusSeconds,
        @PositiveOrZero Long breakSeconds) {
}
