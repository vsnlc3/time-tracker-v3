package com.example.springbackend.manual;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

/** 手動時間記録を利用者・活動日で検索する永続化層です。 */
public interface ManualTimeEntryRepository extends JpaRepository<ManualTimeEntry, Long> {

    /** 指定日の記録をタグとともに ID 順で取得します。 */
    @EntityGraph(attributePaths = "tag")
    List<ManualTimeEntry> findAllByActivityDateAndTag_User_IdOrderById(
            LocalDate activityDate,
            Long userId);

    /** 利用者が所有する全記録を ID 順で取得します。 */
    List<ManualTimeEntry> findAllByTag_User_IdOrderById(Long userId);

    /** 利用者の所有範囲にある記録だけを取得します。 */
    @EntityGraph(attributePaths = "tag")
    Optional<ManualTimeEntry> findByIdAndTag_User_Id(Long entryId, Long userId);

    /** タグが手動記録から参照されているかを調べます。 */
    boolean existsByTag_Id(Long tagId);
}
