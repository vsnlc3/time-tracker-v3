package com.example.springbackend.activity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/** 活動セッションを利用者・日付・開始時刻で検索する永続化層です。 */
public interface ActivitySessionRepository extends JpaRepository<ActivitySession, Long> {

    /** 指定日の利用者所有セッションをタグとともに開始時刻順で取得します。 */
    @EntityGraph(attributePaths = "tag")
    List<ActivitySession> findAllByActivityDateAndTag_User_IdOrderByStartedAtAsc(
            LocalDate activityDate,
            Long userId);

    /** 利用者の全セッションをタグとともに取得します。 */
    @EntityGraph(attributePaths = "tag")
    List<ActivitySession> findAllByTag_User_IdOrderByStartedAtAsc(Long userId);

    /** タグが活動セッションから参照されているかを調べます。 */
    boolean existsByTag_Id(Long tagId);

    /** 利用者の所有範囲にあるセッションだけを取得します。 */
    @EntityGraph(attributePaths = "tag")
    Optional<ActivitySession> findByIdAndTag_User_Id(Long sessionId, Long userId);

    /** 利用者の未終了セッションを開始時刻順で検索します。 */
    @EntityGraph(attributePaths = "tag")
    Optional<ActivitySession> findFirstByTag_User_IdAndEndedAtIsNullOrderByStartedAtAsc(Long userId);
}
