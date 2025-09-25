package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CameraAssignRepository extends JpaRepository<CameraAssign, Long> {
    List<CameraAssign> findByUserId(Long userId);
}
