package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraInfosRepository;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.its.dto.ItsCctvResponse;
import com.sentry.sentry.cam.CameraAssignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraService {
    private final CameraInfosRepository infoRepo;
    private final CameraAssignRepository assignRepo;

    @Transactional
    public CameraInfos saveAndAssign(ItsCctvResponse.CctvItem item, Long userId) {
        // 1) camerainfos upsert
        CameraInfos info = infoRepo.findByCctvUrl(item.cctvurl())
                .orElseGet(() -> infoRepo.save(CameraInfos.builder()
                        .cameraName(item.cctvname())
                        .cctvUrl(item.cctvurl())
                        .coordx(item.coordx() != null ? item.coordx() : 0)
                        .coordy(item.coordy() != null ? item.coordy() : 0)
                        .isAnalisis(false)
                        .build()
                ));

        // 2) cameraassign 중복 체크 후 없으면 저장
        assignRepo.findByUserIdAndAssignedCameraId(userId, info.getCameraId())
                .orElseGet(() -> assignRepo.save(CameraAssign.builder()
                        .userId(userId)
                        .assignedCameraId(info.getCameraId())
                        .build()));

        // ✅ 프론트가 바로 쓰도록 CameraInfos 반환
        return info;
    }

    @Transactional(readOnly = true)
    public List<CameraInfos> listAssigned(Long userId) {
        var ids = assignRepo.findByUserId(userId).stream()
                .map(CameraAssign::getAssignedCameraId)
                .toList();
        return ids.isEmpty() ? List.of() : infoRepo.findByCameraIdIn(ids);
    }
}
