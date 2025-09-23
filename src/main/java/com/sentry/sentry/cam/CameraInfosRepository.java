package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CameraInfosRepository extends JpaRepository<CameraInfos, Long> {

    List<CameraInfos> findByCameraIdIn(List<Long> cameraIds);
}
