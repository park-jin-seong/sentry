package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
@Repository
public interface CamRepository extends JpaRepository<CameraAssign, Long> {

    @Query("SELECT c.assignedCameraId FROM CameraAssign c WHERE c.userId = :userId ")
    List<Long> findAssignedCameraIdByUserId(@Param("userId") Long userId);
}



