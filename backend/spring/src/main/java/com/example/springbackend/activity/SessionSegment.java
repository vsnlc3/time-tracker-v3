package com.example.springbackend.activity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "session_segments")
public class SessionSegment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "activity_session_id", nullable = false)
    private ActivitySession activitySession;

    @Enumerated(EnumType.STRING)
    @Column(name = "segment_type", nullable = false, length = 6)
    private SegmentType segmentType;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "planned_duration_seconds")
    private Long plannedDurationSeconds;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected SessionSegment() {
    }

    public SessionSegment(
            ActivitySession activitySession,
            SegmentType segmentType,
            Instant startedAt,
            Instant endedAt,
            Long plannedDurationSeconds) {
        this.activitySession = activitySession;
        this.segmentType = segmentType;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.plannedDurationSeconds = plannedDurationSeconds;
    }

    public void update(
            SegmentType segmentType,
            Instant startedAt,
            Instant endedAt,
            Long plannedDurationSeconds) {
        this.segmentType = segmentType;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.plannedDurationSeconds = plannedDurationSeconds;
    }

    public void end(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public void startAt(Instant startedAt) {
        this.startedAt = startedAt;
    }

    public Long getId() {
        return id;
    }

    public ActivitySession getActivitySession() {
        return activitySession;
    }

    public SegmentType getSegmentType() {
        return segmentType;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getEndedAt() {
        return endedAt;
    }

    public Long getPlannedDurationSeconds() {
        return plannedDurationSeconds;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
