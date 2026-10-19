package com.example.springbackend.tag;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

/** タグを利用者単位で検索し、重複名や利用状況を調べる永続化層です。 */
public interface TagRepository extends JpaRepository<Tag, Long> {

    /** 利用者のタグを ID 順に取得します。 */
    List<Tag> findAllByUser_IdOrderById(Long userId);

    /** 利用者が所有する指定 ID のタグを検索します。 */
    Optional<Tag> findByIdAndUser_Id(Long tagId, Long userId);

    /** 利用者内で同じ表示名のタグがあるかを調べます。 */
    boolean existsByUser_IdAndDisplayName(Long userId, String displayName);

    /** 更新対象を除き、同じ表示名のタグがあるかを調べます。 */
    boolean existsByUser_IdAndDisplayNameAndIdNot(Long userId, String displayName, Long tagId);

    /** 利用者が持つタグの数を返します。 */
    long countByUser_Id(Long userId);
}
