package com.sentry.sentry.entity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserAuthorityRepository extends JpaRepository<UserAuthority, String> {
    Optional<UserAuthority> findByUsername(String username);
    boolean existsByUsername(String username);
}
