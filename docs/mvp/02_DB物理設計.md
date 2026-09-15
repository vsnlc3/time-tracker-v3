# DB物理設計

## 1. 前提

- DBMS：MySQL 8.0.16以降
- ストレージエンジン：InnoDB
- 文字コード：`utf8mb4`
- デフォルト照合順序：`utf8mb4_0900_ai_ci`
- 日時型：`DATETIME(6)`
- ID型：`BIGINT UNSIGNED AUTO_INCREMENT`
- 秒数を保持する型：`BIGINT UNSIGNED`
- テーブル名・カラム名：小文字のスネークケース
- `CHECK` 制約はMySQL 8.0.16以降で評価されることを前提とする。
- `created_at` はDBの `CURRENT_TIMESTAMP(6)` を初期値とする。
- `updated_at` はDBの `CURRENT_TIMESTAMP(6)` を初期値とし、行更新時に自動更新する。
- `activity_date`、`started_at`、`ended_at`、`planned_end_at` はDBで自動算出しない。

## 2. テーブル定義

### 2.1 `users`

#### カラム定義

| カラム名 | MySQL型 | NULL | DEFAULT | PK / FK / UNIQUE / CHECK | 説明 |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 不可 | なし | PK | ユーザーID |
| `google_subject` | `VARCHAR(255)` | 不可 | なし | UNIQUE | Google Subject |
| `email` | `VARCHAR(320)` | 不可 | なし | - | メールアドレス |
| `display_name` | `VARCHAR(255)` | 不可 | なし | - | 表示名 |
| `created_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 作成日時 |
| `updated_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 更新日時 |

#### INDEX

| INDEX名 | カラム | 種類 |
| --- | --- | --- |
| `PRIMARY` | `id` | PRIMARY KEY |
| `uk_users_google_subject` | `google_subject` | UNIQUE |

### 2.2 `tags`

#### カラム定義

| カラム名 | MySQL型 | NULL | DEFAULT | PK / FK / UNIQUE / CHECK | 説明 |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 不可 | なし | PK | タグID |
| `user_id` | `BIGINT UNSIGNED` | 不可 | なし | FK → `users.id` | 所有ユーザーID |
| `display_name` | `VARCHAR(255)` | 不可 | なし | UNIQUE `(user_id, display_name)` | タグ表示名 |
| `color_key` | `VARCHAR(32)` | 不可 | `green` | - | UI表示用のタグカラーキー |
| `created_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 作成日時 |
| `updated_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 更新日時 |

#### INDEX

| INDEX名 | カラム | 種類 |
| --- | --- | --- |
| `PRIMARY` | `id` | PRIMARY KEY |
| `uk_tags_user_display_name` | `user_id`, `display_name` | UNIQUE |

`uk_tags_user_display_name` は `user_id` を先頭に持つため、ユーザー単位のタグ取得INDEXも兼ねる。

### 2.3 `activity_sessions`

#### カラム定義

| カラム名 | MySQL型 | NULL | DEFAULT | PK / FK / UNIQUE / CHECK | 説明 |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 不可 | なし | PK | 活動セッションID |
| `tag_id` | `BIGINT UNSIGNED` | 不可 | なし | FK → `tags.id` | タグID |
| `activity_date` | `DATE` | 不可 | なし | - | 集計対象日 |
| `started_at` | `DATETIME(6)` | 不可 | なし | - | 開始日時 |
| `ended_at` | `DATETIME(6)` | 可 | `NULL` | CHECK | 終了日時 |
| `planned_duration_seconds` | `BIGINT UNSIGNED` | 可 | `NULL` | CHECK | 予定時間（秒） |
| `planned_end_at` | `DATETIME(6)` | 可 | `NULL` | CHECK | 予定終了日時 |
| `created_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 作成日時 |
| `updated_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 更新日時 |

#### INDEX

| INDEX名 | カラム | 種類 |
| --- | --- | --- |
| `PRIMARY` | `id` | PRIMARY KEY |
| `idx_activity_sessions_tag_date_start` | `tag_id`, `activity_date`, `started_at` | INDEX |
| `idx_activity_sessions_tag_time` | `tag_id`, `started_at`, `ended_at` | INDEX |

#### CHECK

- `ended_at` はNULL、または `started_at` より後であること。
- `planned_duration_seconds` はNULL、または1秒以上であること。
- `planned_end_at` はNULL、または `started_at` より後であること。
- `planned_duration_seconds` と `planned_end_at` は同時にNULL以外にならないこと。

### 2.4 `session_segments`

#### カラム定義

| カラム名 | MySQL型 | NULL | DEFAULT | PK / FK / UNIQUE / CHECK | 説明 |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 不可 | なし | PK | セッション区間ID |
| `activity_session_id` | `BIGINT UNSIGNED` | 不可 | なし | FK → `activity_sessions.id` | 親活動セッションID |
| `segment_type` | `VARCHAR(6) CHARACTER SET ascii COLLATE ascii_bin` | 不可 | なし | CHECK | `FOCUS` または `BREAK` |
| `started_at` | `DATETIME(6)` | 不可 | なし | - | 開始日時 |
| `ended_at` | `DATETIME(6)` | 可 | `NULL` | CHECK | 終了日時 |
| `planned_duration_seconds` | `BIGINT UNSIGNED` | 可 | `NULL` | CHECK | 予定時間（秒） |
| `created_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 作成日時 |
| `updated_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 更新日時 |

#### INDEX

| INDEX名 | カラム | 種類 |
| --- | --- | --- |
| `PRIMARY` | `id` | PRIMARY KEY |
| `idx_session_segments_session_time` | `activity_session_id`, `started_at`, `ended_at` | INDEX |

#### CHECK

- `segment_type` は `FOCUS` または `BREAK` のいずれかであること。
- `ended_at` はNULL、または `started_at` より後であること。
- `planned_duration_seconds` はNULL、または1秒以上であること。

### 2.5 `manual_time_entries`

#### カラム定義

| カラム名 | MySQL型 | NULL | DEFAULT | PK / FK / UNIQUE / CHECK | 説明 |
| --- | --- | --- | --- | --- | --- |
| `id` | `BIGINT UNSIGNED` | 不可 | なし | PK | 手動時間記録ID |
| `tag_id` | `BIGINT UNSIGNED` | 不可 | なし | FK → `tags.id` | タグID |
| `activity_date` | `DATE` | 不可 | なし | - | 対象日 |
| `total_seconds` | `BIGINT UNSIGNED` | 不可 | なし | CHECK | 合計時間（秒） |
| `focus_seconds` | `BIGINT UNSIGNED` | 不可 | なし | CHECK | FOCUS時間（秒） |
| `break_seconds` | `BIGINT UNSIGNED` | 不可 | なし | CHECK | BREAK時間（秒） |
| `created_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 作成日時 |
| `updated_at` | `DATETIME(6)` | 不可 | `CURRENT_TIMESTAMP(6)` | - | 更新日時 |

#### INDEX

| INDEX名 | カラム | 種類 |
| --- | --- | --- |
| `PRIMARY` | `id` | PRIMARY KEY |
| `idx_manual_time_entries_tag_date` | `tag_id`, `activity_date` | INDEX |

#### CHECK

- `total_seconds` は1秒以上であること。
- `focus_seconds` は0秒以上であること。
- `break_seconds` は0秒以上であること。
- `total_seconds = focus_seconds + break_seconds` であること。

### 2.6 CREATE TABLE

依存関係順に実行する。

```sql
CREATE TABLE users (
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

CREATE TABLE tags (
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

CREATE TABLE activity_sessions (
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

CREATE TABLE session_segments (
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

CREATE TABLE manual_time_entries (
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
```

## 3. 外部キー・ON DELETE方針

| 親テーブル | 子テーブル | 外部キー | ON DELETE | 理由 |
| --- | --- | --- | --- | --- |
| `users` | `tags` | `tags.user_id` → `users.id` | `RESTRICT` | ユーザー削除はMVPの要件外であり、ユーザー削除による記録の連鎖削除を発生させない |
| `tags` | `activity_sessions` | `activity_sessions.tag_id` → `tags.id` | `CASCADE` | タグ削除時に関連する活動セッションも削除する |
| `tags` | `manual_time_entries` | `manual_time_entries.tag_id` → `tags.id` | `CASCADE` | タグ削除時に関連する手動時間記録も削除する |
| `activity_sessions` | `session_segments` | `session_segments.activity_session_id` → `activity_sessions.id` | `CASCADE` | 活動セッション削除時に関連するセッション区間も削除する |

## 4. DBで保証する制約

DBのPK、FK、UNIQUE、CHECK、NOT NULLで保証する制約のみを記載する。

- 各テーブルの主キーによる一意性
- `users.google_subject` の一意性
- `tags.user_id` が存在する `users.id` を参照すること
- 同一ユーザー内の `tags.display_name` の一意性
- `activity_sessions.tag_id` が存在する `tags.id` を参照すること
- `session_segments.activity_session_id` が存在する `activity_sessions.id` を参照すること
- `manual_time_entries.tag_id` が存在する `tags.id` を参照すること
- 必須カラムがNULLにならないこと
- `activity_sessions.ended_at` がNULLまたは `started_at` より後であること
- `activity_sessions.planned_duration_seconds` がNULLまたは1秒以上であること
- `activity_sessions.planned_end_at` がNULLまたは `started_at` より後であること
- `activity_sessions.planned_duration_seconds` と `planned_end_at` が同時指定されないこと
- `session_segments.segment_type` が `FOCUS` または `BREAK` であること
- `session_segments.ended_at` がNULLまたは `started_at` より後であること
- `session_segments.planned_duration_seconds` がNULLまたは1秒以上であること
- `manual_time_entries.total_seconds` が1秒以上であること
- `manual_time_entries.focus_seconds` と `break_seconds` が0秒以上であること
- `manual_time_entries.total_seconds = focus_seconds + break_seconds` であること

## 5. アプリケーション層で保証する制約

通常のPK、FK、UNIQUE、CHECKでは保証できない制約のみをService層で保証する。

- 認証済みユーザーが対象データの所有者であることの確認
- `User → Tag → ActivitySession / SessionSegment / ManualTimeEntry` の所有関係に基づく認可
- 同一ユーザーの `ActivitySession` の実時間重複禁止
- `ended_at IS NULL` の進行中 `ActivitySession` が1ユーザー1件であること
- `ActivitySession` の新規作成・時刻変更時に、`activity_date` ではなく `started_at` / `ended_at` で重複判定すること
- `SessionSegment` の時間重複・空白禁止
- `SessionSegment` が親 `ActivitySession` の時間範囲内にあること
- 完了した `ActivitySession` の全時間を `SessionSegment` が連続して覆うこと
- 進行中 `ActivitySession` に進行中 `SessionSegment` が1件だけ存在すること
- FOCUS / BREAK切り替え時に、前区間の終了時刻と次区間の開始時刻を同一にすること
- `ActivitySession` の作成・終了と、初期・終了 `SessionSegment` の更新を同一トランザクションで行うこと
- 複数リクエストによる時間重複・二重開始を防ぐためのユーザー単位のロックまたは同等の直列化
- `activity_date` は集計対象日の独立した値として保持し、日時からDBで自動算出しないこと
- 通常のリアルタイムセッション開始時は、開始時点のアプリケーション上のローカル日付を `activity_date` の初期値にすること
- 手動入力時はユーザー指定の対象日を `activity_date` に設定すること
- `started_at` を変更しても `activity_date` を自動変更せず、変更時は明示的に更新すること
