// src/main/java/com/sentry/sentry/camera/CameraService.java
package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraAssignRepository;
import com.sentry.sentry.cam.CameraInfosRepository;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraService {
    private final CameraInfosRepository infoRepo;
    private final CameraAssignRepository assignRepo;

    /** CCTV 하나 저장 + 사용자에게 할당 (업서트) */
    @Transactional
    public CameraInfos saveAndAssign(AssignReq item, Long userId) {
        CameraInfos info = infoRepo.findByCctvUrl(item.cctvurl())
                .orElseGet(() -> CameraInfos.builder()
                        .cameraName(item.cctvname() != null ? item.cctvname() : "Unnamed")
                        .cctvUrl(item.cctvurl())
                        .coordx(item.coordx() != null ? item.coordx() : 0d)
                        .coordy(item.coordy() != null ? item.coordy() : 0d)
                        .isAnalisis(false)
                        .build()
                );
        // 기존 값 최신화(원하면 유지)
        if (item.cctvname() != null) info.setCameraName(item.cctvname());
        if (item.coordx() != null)   info.setCoordx(item.coordx());
        if (item.coordy() != null)   info.setCoordy(item.coordy());
        info = infoRepo.save(info);

        // 매핑 없으면 생성
        final Long camId = info.getCameraId(); // ⚠️ 람다에서 쓰니 final 로 보관
        assignRepo.findByUserIdAndAssignedCameraId(userId, camId)
                .orElseGet(() -> assignRepo.save(CameraAssign.builder()
                        .userId(userId)
                        .assignedCameraId(camId)
                        .build()));

        return info;
    }

    /** 사용자에게 할당된 카메라 목록 */
    @Transactional(readOnly = true)
    public List<CameraInfos> listAssigned(Long userId) {
        var ids = assignRepo.findByUserId(userId).stream()
                .map(CameraAssign::getAssignedCameraId)
                .toList();
        return ids.isEmpty() ? List.of() : infoRepo.findByCameraIdIn(ids);
    }

    /** ✅ 항상 하드 삭제: 모든 매핑 제거 뒤 camerainfos 삭제 */
    @Transactional
    public void deleteCamera(Long cameraId) {
        // 1) 모든 사용자 매핑 제거 (FK 차단 예방)
        assignRepo.deleteByAssignedCameraId(cameraId);
        // 2) 마스터 삭제
        infoRepo.deleteById(cameraId);
    }

    /** 카메라 메타 수정 (옵션) */
    @Transactional
    public CameraInfos updateCamera(Long cameraId, CameraUpdateReq req) {
        var c = infoRepo.findById(cameraId)
                .orElseThrow(() -> new IllegalArgumentException("camera not found: " + cameraId));
        if (req.cameraName() != null) c.setCameraName(req.cameraName());
        if (req.coordx() != null)     c.setCoordx(req.coordx());
        if (req.coordy() != null)     c.setCoordy(req.coordy());
        if (req.isAnalisis() != null) c.setAnalisis(req.isAnalisis());
        return infoRepo.save(c);
    }

    /** 프론트 전송용 간단 요청 DTO */
    public record AssignReq(String cctvname, String cctvurl, Double coordx, Double coordy, String cctvformat) {}
    public record CameraUpdateReq(String cameraName, Double coordx, Double coordy, Boolean isAnalisis) {}
}
