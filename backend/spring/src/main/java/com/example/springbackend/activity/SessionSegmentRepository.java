package com.example.springbackend.activity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/** セッションに属するセグメントを開始時刻順に扱う永続化層です。 */
public interface SessionSegmentRepository extends JpaRepository<SessionSegment, Long> {

    /** セッションの全セグメントを時間順で取得します。 */
    List<SessionSegment> findAllByActivitySession_IdOrderByStartedAtAsc(Long activitySessionId);

    /** 指定利用者が所有するセグメントだけを取得します。 */
    Optional<SessionSegment> findByIdAndActivitySession_Tag_User_Id(Long segmentId, Long userId);
}
