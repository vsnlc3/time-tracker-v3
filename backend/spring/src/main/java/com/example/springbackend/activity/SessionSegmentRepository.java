package com.example.springbackend.activity;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface SessionSegmentRepository extends JpaRepository<SessionSegment, Long> {

    List<SessionSegment> findAllByActivitySession_IdOrderByStartedAtAsc(Long activitySessionId);

    Optional<SessionSegment> findByIdAndActivitySession_Tag_User_Id(Long segmentId, Long userId);
}
