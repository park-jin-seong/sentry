// src/main/java/com/sentry/sentry/analysis/AnalysisAssignService.java
package com.sentry.sentry.analysis;

import com.sentry.sentry.cam.CameraInfosRepository;
import com.sentry.sentry.entity.CameraInfos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AnalysisAssignService {
    private final CameraInfosRepository cameraInfosRepository;

    /** 엔티티가 아니라 DTO로 리턴 */
    @Transactional(readOnly = true)
    public List<CameraDto> listAssignableCameras(Long serverId) {
        var list = cameraInfosRepository.findAssignable(serverId.intValue());
        return list.stream()
                .map(c -> new CameraDto(
                        c.getCameraId(),
                        c.getCameraName(),
                        c.getAnalysisServer() != null ? c.getAnalysisServer().getServerId() : null
                ))
                .toList();
    }

    @Transactional
    public int assignCamerasToServer(Long serverId, List<Long> cameraIds) {
        if (cameraIds == null || cameraIds.isEmpty()) return 0;
        return cameraInfosRepository.bulkAssignToServer(serverId.intValue(), cameraIds);
    }

    public record CameraDto(Long cameraId, String cameraName, Integer analysisServerId) {}

    // com.sentry.sentry.analysis.AnalysisAssignService
    @Transactional
    public int unassignCamerasFromServer(Long serverId, List<Long> cameraIds) {
        if (cameraIds == null || cameraIds.isEmpty()) return 0;
        Integer sid = (serverId == null ? null : serverId.intValue());
        return cameraInfosRepository.bulkUnassignFromServer(sid, cameraIds);
    }



}

