package com.sentry.sentry.camera.repo;

import com.sentry.sentry.entity.CameraAssign;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CameraAssignRepository extends JpaRepository<CameraAssign, Long> {

    void deleteByIdAndUserId(Long id, Long userId);

    // 교차-DB 조인은 네이티브로 확실히!
    @Query(value = """
        SELECT i.cameraId, i.cameraName, i.cctvUrl, i.coordx, i.coordy, a.id AS assignId
          FROM sentry_client.cameraassign a
          JOIN sentry_server.camerainfos i
                ON i.cameraId = a.assignedcameraId
         WHERE a.userId = :userId
         ORDER BY i.cameraName
        """, nativeQuery = true)
    List<Object[]> findAssignedCameraRows(@Param("userId") Long userId);
}
