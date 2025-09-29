package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import java.util.List;
import java.util.Optional;

public interface CameraAssignRepository extends JpaRepository<CameraAssign, Long> {
    List<CameraAssign> findByUserId(Long userId);
    Optional<CameraAssign> findByUserIdAndAssignedCameraId(Long userId, Long assignedCameraId);

    @Modifying
    @Transactional
    void deleteByUserIdAndAssignedCameraId(Long userId, Long assignedCameraId);

    // 하드 삭제 시 모든 사용자 매핑 제거
    @Modifying
    @Transactional
    void deleteByAssignedCameraId(Long assignedCameraId);
}
