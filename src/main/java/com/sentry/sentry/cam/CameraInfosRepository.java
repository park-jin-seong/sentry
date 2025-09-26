package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CameraInfosRepository extends JpaRepository<CameraInfos, Long> {

    List<CameraInfos> findByCameraIdIn(List<Long> cameraIds);

    CameraInfos getCameraInfosByCameraId(Long cameraId);

    CameraInfos getCameraInfosByCameraName(String cameraName);

    List<CameraInfos> findCameraInfosByCameraName(String cameraName);

    List<CameraInfos> findByCameraNameContaining(String cameraName);
    Optional<CameraInfos> findByCctvUrl(String cctvUrl);
}
