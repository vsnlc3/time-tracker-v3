package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;

import com.example.springbackend.tag.Tag;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "activity_sessions")
public class ActivitySession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "ended_at")
    private Instant endedAt;

    @Column(name = "planned_duration_seconds")
    private Long plannedDurationSeconds;

    @Column(name = "planned_end_at")
    private Instant plannedEndAt;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected ActivitySession() {
    }

    public ActivitySession(
            Tag tag,
            LocalDate activityDate,
            Instant startedAt,
            Instant endedAt,
            Long plannedDurationSeconds,
            Instant plannedEndAt) {
        this.tag = tag;
        this.activityDate = activityDate;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.plannedDurationSeconds = plannedDurationSeconds;
        this.plannedEndAt = plannedEndAt;
    }

    public void update(
            Tag tag,
            LocalDate activityDate,
            Instant startedAt,
            Instant endedAt,
            Long plannedDurationSeconds,
            Instant plannedEndAt) {
        this.tag = tag;
        this.activityDate = activityDate;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.plannedDurationSeconds = plannedDurationSeconds;
        this.plannedEndAt = plannedEndAt;
    }

    public void finish(Instant endedAt) {
        this.endedAt = endedAt;
    }

    public Long getId() {
        return id;
    }

    public Tag getTag() {
        return tag;
    }

    public LocalDate getActivityDate() {
        return activityDate;
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

    public Instant getPlannedEndAt() {
        return plannedEndAt;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
