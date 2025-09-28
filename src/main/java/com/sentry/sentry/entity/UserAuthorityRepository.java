// src/main/java/com/sentry/sentry/entity/UserAuthorityRepository.java
package com.sentry.sentry.entity;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface UserAuthorityRepository extends JpaRepository<UserAuthority, UserAuthority.Pk> {
    Optional<UserAuthority> findByUserId(Long userId);
    List<UserAuthority> findAllByAuthority(String authority);
    void deleteByUserId(Long userId);

    @Query("""
           select ua.userId
           from UserAuthority ua
           where upper(ua.authority) in :roles
           """)
    List<Long> findUserIdsByAuthorities(@Param("roles") Collection<String> roles);
}

