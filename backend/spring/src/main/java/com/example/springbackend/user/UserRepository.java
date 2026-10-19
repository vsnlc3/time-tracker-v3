package com.example.springbackend.user;

import java.util.Optional;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/** 利用者の永続化と、同時更新時に利用する検索を提供します。 */
public interface UserRepository extends JpaRepository<User, Long> {

    /** Google の一意な subject から利用者を検索します。 */
    Optional<User> findByGoogleSubject(String googleSubject);

    /** 利用者行を悲観ロックして取得し、同一利用者に対する更新を直列化します。 */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);
}
