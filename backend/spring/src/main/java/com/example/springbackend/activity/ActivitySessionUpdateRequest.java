package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** セッション編集 API の入力です。終了時刻 null は未終了状態を表します。 */
public record ActivitySessionUpdateRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull Instant startedAt,
        Instant endedAt,
        @Positive Long plannedDurationSeconds,
        Instant plannedEndAt) {
}
