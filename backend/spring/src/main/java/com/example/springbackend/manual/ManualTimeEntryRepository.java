package com.example.springbackend.manual;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ManualTimeEntryRepository extends JpaRepository<ManualTimeEntry, Long> {

    @EntityGraph(attributePaths = "tag")
    List<ManualTimeEntry> findAllByActivityDateAndTag_User_IdOrderById(
            LocalDate activityDate,
            Long userId);

    List<ManualTimeEntry> findAllByTag_User_IdOrderById(Long userId);

    @EntityGraph(attributePaths = "tag")
    Optional<ManualTimeEntry> findByIdAndTag_User_Id(Long entryId, Long userId);

    boolean existsByTag_Id(Long tagId);
}
