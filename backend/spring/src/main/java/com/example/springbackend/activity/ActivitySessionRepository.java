package com.example.springbackend.activity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActivitySessionRepository extends JpaRepository<ActivitySession, Long> {

    @EntityGraph(attributePaths = "tag")
    List<ActivitySession> findAllByActivityDateAndTag_User_IdOrderByStartedAtAsc(
            LocalDate activityDate,
            Long userId);

    @EntityGraph(attributePaths = "tag")
    List<ActivitySession> findAllByTag_User_IdOrderByStartedAtAsc(Long userId);

    boolean existsByTag_Id(Long tagId);

    @EntityGraph(attributePaths = "tag")
    Optional<ActivitySession> findByIdAndTag_User_Id(Long sessionId, Long userId);

    @EntityGraph(attributePaths = "tag")
    Optional<ActivitySession> findFirstByTag_User_IdAndEndedAtIsNullOrderByStartedAtAsc(Long userId);
}
