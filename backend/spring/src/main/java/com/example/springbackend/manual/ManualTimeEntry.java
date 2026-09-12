package com.example.springbackend.manual;

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
@Table(name = "manual_time_entries")
public class ManualTimeEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "tag_id", nullable = false)
    private Tag tag;

    @Column(name = "activity_date", nullable = false)
    private LocalDate activityDate;

    @Column(name = "total_seconds", nullable = false)
    private Long totalSeconds;

    @Column(name = "focus_seconds", nullable = false)
    private Long focusSeconds;

    @Column(name = "break_seconds", nullable = false)
    private Long breakSeconds;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected ManualTimeEntry() {
    }

    public ManualTimeEntry(
            Tag tag,
            LocalDate activityDate,
            Long totalSeconds,
            Long focusSeconds,
            Long breakSeconds) {
        this.tag = tag;
        this.activityDate = activityDate;
        this.totalSeconds = totalSeconds;
        this.focusSeconds = focusSeconds;
        this.breakSeconds = breakSeconds;
    }

    public void update(
            Tag tag,
            LocalDate activityDate,
            Long totalSeconds,
            Long focusSeconds,
            Long breakSeconds) {
        this.tag = tag;
        this.activityDate = activityDate;
        this.totalSeconds = totalSeconds;
        this.focusSeconds = focusSeconds;
        this.breakSeconds = breakSeconds;
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

    public Long getTotalSeconds() {
        return totalSeconds;
    }

    public Long getFocusSeconds() {
        return focusSeconds;
    }

    public Long getBreakSeconds() {
        return breakSeconds;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
