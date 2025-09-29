package com.sentry.sentry.image;

import com.sentry.sentry.entity.EventResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventResultRepository extends JpaRepository<EventResult, Long>, CustomEventResultRepository {
    List<EventResult> findByCameraInfo_CameraId(Long cameraId);
}
