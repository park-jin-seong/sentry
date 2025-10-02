package com.sentry.sentry.entity;

import com.sentry.sentry.entity.UserAuthority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface UserAuthorityRepository extends JpaRepository<UserAuthority, Long> {
    Optional<UserAuthority> findByUserId(Long userId);
    List<UserAuthority> findAllByAuthority(String authority);
    void deleteByUserId(Long userId);
}
