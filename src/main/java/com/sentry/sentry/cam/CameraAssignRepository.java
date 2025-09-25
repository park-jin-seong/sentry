package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface CameraAssignRepository extends JpaRepository<CameraAssign, Long> {
    List<CameraAssign> findByUserId(Long userId);
    Optional<CameraAssign> findByUserIdAndAssignedCameraId(Long userId, Long assignedCameraId);
    void deleteByUserIdAndAssignedCameraId(Long userId, Long assignedCameraId);
}
