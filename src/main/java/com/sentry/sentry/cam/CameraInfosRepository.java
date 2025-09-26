package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CameraInfosRepository extends JpaRepository<CameraInfos, Long> {

    List<CameraInfos> findByCameraIdIn(List<Long> cameraIds);
    Optional<CameraInfos> findByCctvUrl(String cctvUrl);
}
