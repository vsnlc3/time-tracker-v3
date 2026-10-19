package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 時刻または経過秒数を使って、完了済みセッションを登録する入力です。 */
public record TimedManualSessionRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull SegmentType segmentType,
        Instant startedAt,
        Instant endedAt,
        @Positive Long durationSeconds) {
}
