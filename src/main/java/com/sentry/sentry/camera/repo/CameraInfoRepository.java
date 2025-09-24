package com.sentry.sentry.camera.repo;

import com.sentry.sentry.entity.CameraInfos;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CameraInfoRepository extends JpaRepository<CameraInfos, Long> {
    Optional<CameraInfos> findByCctvUrl(String cctvUrl);
}
