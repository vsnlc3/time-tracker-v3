package com.example.springbackend.activity;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ActivitySessionResponse(
        Long id,
        Long tagId,
        String tagDisplayName,
        LocalDate activityDate,
        Instant startedAt,
        Instant endedAt,
        Long plannedDurationSeconds,
        Instant plannedEndAt,
        Long durationSeconds,
        boolean active,
        List<SessionSegmentResponse> segments) {

    public static ActivitySessionResponse from(
            ActivitySession session,
            List<SessionSegment> segments,
            Instant now) {
        Instant end = session.getEndedAt() == null ? now : session.getEndedAt();
        long duration = Math.max(0, Duration.between(session.getStartedAt(), end).getSeconds());
        return new ActivitySessionResponse(
                session.getId(),
                session.getTag().getId(),
                session.getTag().getDisplayName(),
                session.getActivityDate(),
                session.getStartedAt(),
                session.getEndedAt(),
                session.getPlannedDurationSeconds(),
                session.getPlannedEndAt(),
                duration,
                session.getEndedAt() == null,
                segments.stream().map(segment -> SessionSegmentResponse.from(segment, now)).toList());
    }
}
