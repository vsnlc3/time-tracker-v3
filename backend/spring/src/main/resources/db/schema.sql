CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    google_subject VARCHAR(255) NOT NULL,
    email VARCHAR(320) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_google_subject (google_subject)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS tags (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    color_key VARCHAR(32) NOT NULL DEFAULT 'green',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_tags_user_display_name (user_id, display_name),
    CONSTRAINT fk_tags_user
        FOREIGN KEY (user_id) REFERENCES users (id)
        ON DELETE RESTRICT
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

-- Keep an existing v2 database compatible while preserving the v0 tag palette.
SET @tag_color_column_exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = DATABASE()
      AND table_name = 'tags'
      AND column_name = 'color_key'
);
SET @tag_color_migration = IF(
    @tag_color_column_exists = 0,
    'ALTER TABLE tags ADD COLUMN color_key VARCHAR(32) NOT NULL DEFAULT ''green'' AFTER display_name',
    'SELECT 1'
);
PREPARE add_tag_color FROM @tag_color_migration;
EXECUTE add_tag_color;
DEALLOCATE PREPARE add_tag_color;

CREATE TABLE IF NOT EXISTS activity_sessions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tag_id BIGINT UNSIGNED NOT NULL,
    activity_date DATE NOT NULL,
    started_at DATETIME(6) NOT NULL,
    ended_at DATETIME(6) NULL DEFAULT NULL,
    planned_duration_seconds BIGINT UNSIGNED NULL DEFAULT NULL,
    planned_end_at DATETIME(6) NULL DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_activity_sessions_tag_date_start
        (tag_id, activity_date, started_at),
    KEY idx_activity_sessions_tag_time
        (tag_id, started_at, ended_at),
    CONSTRAINT fk_activity_sessions_tag
        FOREIGN KEY (tag_id) REFERENCES tags (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_activity_sessions_ended_after_started
        CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT chk_activity_sessions_planned_duration_positive
        CHECK (planned_duration_seconds IS NULL OR planned_duration_seconds >= 1),
    CONSTRAINT chk_activity_sessions_planned_end_after_started
        CHECK (planned_end_at IS NULL OR planned_end_at > started_at),
    CONSTRAINT chk_activity_sessions_planned_values_exclusive
        CHECK (planned_duration_seconds IS NULL OR planned_end_at IS NULL)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS session_segments (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    activity_session_id BIGINT UNSIGNED NOT NULL,
    segment_type VARCHAR(6) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    started_at DATETIME(6) NOT NULL,
    ended_at DATETIME(6) NULL DEFAULT NULL,
    planned_duration_seconds BIGINT UNSIGNED NULL DEFAULT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_session_segments_session_time
        (activity_session_id, started_at, ended_at),
    CONSTRAINT fk_session_segments_activity_session
        FOREIGN KEY (activity_session_id) REFERENCES activity_sessions (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_session_segments_type
        CHECK (segment_type IN ('FOCUS', 'BREAK')),
    CONSTRAINT chk_session_segments_ended_after_started
        CHECK (ended_at IS NULL OR ended_at > started_at),
    CONSTRAINT chk_session_segments_planned_duration_positive
        CHECK (planned_duration_seconds IS NULL OR planned_duration_seconds >= 1)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS manual_time_entries (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    tag_id BIGINT UNSIGNED NOT NULL,
    activity_date DATE NOT NULL,
    total_seconds BIGINT UNSIGNED NOT NULL,
    focus_seconds BIGINT UNSIGNED NOT NULL,
    break_seconds BIGINT UNSIGNED NOT NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6)
        ON UPDATE CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    KEY idx_manual_time_entries_tag_date
        (tag_id, activity_date),
    CONSTRAINT fk_manual_time_entries_tag
        FOREIGN KEY (tag_id) REFERENCES tags (id)
        ON DELETE CASCADE,
    CONSTRAINT chk_manual_time_entries_total_positive
        CHECK (total_seconds >= 1),
    CONSTRAINT chk_manual_time_entries_focus_non_negative
        CHECK (focus_seconds >= 0),
    CONSTRAINT chk_manual_time_entries_break_non_negative
        CHECK (break_seconds >= 0),
    CONSTRAINT chk_manual_time_entries_total_equals_breakdown
        CHECK (total_seconds = focus_seconds + break_seconds)
) ENGINE = InnoDB
  DEFAULT CHARACTER SET = utf8mb4
  COLLATE = utf8mb4_0900_ai_ci;
