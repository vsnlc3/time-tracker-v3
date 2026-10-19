package com.example.springbackend.activity;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** セッション内で次に記録する時間区分を指定する入力です。 */
public record SegmentSwitchRequest(
        @NotNull SegmentType segmentType,
        @Positive Long plannedDurationSeconds) {
}
