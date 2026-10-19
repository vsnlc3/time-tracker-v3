package com.example.springbackend.activity;

import java.time.LocalDate;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** 計測開始時に必要なタグ、日付、初期区分、任意の計画値を受け取ります。 */
public record StartActivitySessionRequest(
        @NotNull Long tagId,
        @NotNull LocalDate activityDate,
        @NotNull SegmentType initialSegmentType,
        @Positive Long segmentPlannedDurationSeconds,
        @Positive Long plannedDurationSeconds,
        java.time.Instant plannedEndAt) {
}
