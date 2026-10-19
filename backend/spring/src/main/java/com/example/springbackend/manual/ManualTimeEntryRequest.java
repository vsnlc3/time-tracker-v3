package com.example.springbackend.manual;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

/** 日単位の手動記録と、集中・休憩の秒数内訳を受け取る API 入力です。 */
public record ManualTimeEntryRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @Positive Long totalSeconds,
        @PositiveOrZero Long focusSeconds,
        @PositiveOrZero Long breakSeconds) {
}
