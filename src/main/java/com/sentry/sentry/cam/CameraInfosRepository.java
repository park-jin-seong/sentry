// src/main/java/com/sentry/sentry/cam/CameraInfosRepository.java
package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
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

    // 리스트: analysisServerId가 null이거나 특정 serverId인 카메라만
    @Query(value = """
        SELECT  c.* 
        FROM    sentry_server.camerainfos c
        WHERE   c.analysisServerId IS NULL
            OR  c.analysisServerId = :serverId
        ORDER BY c.cameraName
        """, nativeQuery = true)
    List<CameraInfos> findAssignable(@Param("serverId") Integer serverId);

    // 일괄 배정
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
        UPDATE sentry_server.camerainfos
           SET analysisServerId = :serverId
         WHERE cameraId IN (:ids)
        """, nativeQuery = true)
    int bulkAssignToServer(@Param("serverId") Integer serverId,
                           @Param("ids") Collection<Long> ids);
}