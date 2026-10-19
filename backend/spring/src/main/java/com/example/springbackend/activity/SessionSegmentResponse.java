package com.example.springbackend.activity;

import java.time.Duration;
import java.time.Instant;

/** セグメントの API 応答です。進行中区間の経過秒数も表します。 */
public record SessionSegmentResponse(
        Long id,
        SegmentType segmentType,
        Instant startedAt,
        Instant endedAt,
        Long plannedDurationSeconds,
        Long durationSeconds) {

    /** 指定時点を基準に、セグメントを画面向けの値へ変換します。 */
    public static SessionSegmentResponse from(SessionSegment segment, Instant now) {
        Instant end = segment.getEndedAt() == null ? now : segment.getEndedAt();
        long duration = Math.max(0, Duration.between(segment.getStartedAt(), end).getSeconds());
        return new SessionSegmentResponse(
                segment.getId(),
                segment.getSegmentType(),
                segment.getStartedAt(),
                segment.getEndedAt(),
                segment.getPlannedDurationSeconds(),
                duration);
    }
}
