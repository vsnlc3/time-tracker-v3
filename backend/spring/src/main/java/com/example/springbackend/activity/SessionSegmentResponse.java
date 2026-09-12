package com.example.springbackend.activity;

import java.time.Duration;
import java.time.Instant;

public record SessionSegmentResponse(
        Long id,
        SegmentType segmentType,
        Instant startedAt,
        Instant endedAt,
        Long plannedDurationSeconds,
        Long durationSeconds) {

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
