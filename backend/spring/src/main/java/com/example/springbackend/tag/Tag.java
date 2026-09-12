package com.example.springbackend.tag;

import java.time.Instant;

import com.example.springbackend.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(name = "tags", uniqueConstraints = @UniqueConstraint(
        name = "uk_tags_user_id_display_name",
        columnNames = {"user_id", "display_name"}))
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "display_name", nullable = false, length = 255)
    private String displayName;

    @Column(name = "color_key", nullable = false, length = 32)
    private String colorKey;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    protected Tag() {
    }

    public Tag(User user, String displayName, String colorKey) {
        this.user = user;
        this.displayName = displayName;
        this.colorKey = colorKey;
    }

    public void update(String displayName, String colorKey) {
        this.displayName = displayName;
        this.colorKey = colorKey;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getColorKey() {
        return colorKey;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }
}
