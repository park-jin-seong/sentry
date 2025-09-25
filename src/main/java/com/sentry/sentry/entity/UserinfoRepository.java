package com.sentry.sentry.entity;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserinfoRepository extends JpaRepository<Userinfo, Long> {
    Optional<Userinfo> findByUsername(String username);
    Optional<Userinfo> findById(long userId);
    boolean existsByUsername(String username);
    boolean existsByNickname(String nickname);
    boolean existsByNicknameAndIdNot(String nickname, Long id);
    Optional<CameraInfos> findByCctvUrl(String cctvUrl);
}
