package com.example.springbackend.tag;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface TagRepository extends JpaRepository<Tag, Long> {

    List<Tag> findAllByUser_IdOrderById(Long userId);

    Optional<Tag> findByIdAndUser_Id(Long tagId, Long userId);

    boolean existsByUser_IdAndDisplayName(Long userId, String displayName);

    boolean existsByUser_IdAndDisplayNameAndIdNot(Long userId, String displayName, Long tagId);

    long countByUser_Id(Long userId);
}
