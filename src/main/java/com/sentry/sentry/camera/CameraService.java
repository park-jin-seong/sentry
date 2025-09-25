package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraInfosRepository;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.its.dto.ItsCctvResponse;
import com.sentry.sentry.cam.CameraAssignRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraInfosRepository infoRepo;
    private final CameraAssignRepository assignRepo;

    /** CCTV 하나 저장 + 사용자에게 할당 */
    @Transactional
    public CameraAssign saveAndAssign(ItsCctvResponse.CctvItem item, Long userId) {
        // 1) camerainfos에 (cctvUrl 기준) 중복 체크 후 저장/업데이트
        CameraInfos info = infoRepo.findByCctvUrl(item.cctvurl())
                .orElseGet(() -> CameraInfos.builder()
                        .cameraName(item.cctvname())
                        .cctvUrl(item.cctvurl())
                        .coordx(item.coordx() != null ? item.coordx() : 0)
                        .coordy(item.coordy() != null ? item.coordy() : 0)
                        .isAnalisis(false) // 초기에는 false로
                        .build()
                );

        if (info.getCameraId() == null) {
            info = infoRepo.save(info);
        }

        // 2) cameraassign에 매핑 (userId + cameraId)
        CameraAssign assign = CameraAssign.builder()
                .userId(userId)
                .assignedCameraId(info.getCameraId())
                .build();

        return assignRepo.save(assign);
    }
}
