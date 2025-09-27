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

    /** 사용자에게 할당된 카메라 목록 */
    @Transactional(readOnly = true)
    public List<CameraInfos> listAssigned(Long userId) {
        var ids = assignRepo.findByUserId(userId).stream()
                .map(CameraAssign::getAssignedCameraId)
                .toList();
        return ids.isEmpty() ? List.of() : infoRepo.findByCameraIdIn(ids);
    }

    /** CCTV 저장 + 사용자에게 할당 (업서트) */
    @Transactional
    public CameraInfos saveAndAssign(AssignReq item, Long userId) {
        CameraInfos info = infoRepo.findByCctvUrl(item.cctvurl())
                .orElseGet(() -> CameraInfos.builder()
                        .cameraName(item.cctvname() != null ? item.cctvname() : "Unnamed")
                        .cctvUrl(item.cctvurl())
                        .coordx(item.coordx() != null ? item.coordx() : 0d)
                        .coordy(item.coordy() != null ? item.coordy() : 0d)
                        .isAnalisis(false)
                        .ownerUserId(userId)   // 최초 업로더
                        .build()
                );

        // 과거 데이터 보정(0/null이면 오너 지정)
        if (info.getOwnerUserId() == null || info.getOwnerUserId() == 0L) {
            info.setOwnerUserId(userId);
        }

        if (item.cctvname() != null) info.setCameraName(item.cctvname());
        if (item.coordx() != null)   info.setCoordx(item.coordx());
        if (item.coordy() != null)   info.setCoordy(item.coordy());
        info = infoRepo.save(info);

        final Long camId = info.getCameraId();
        assignRepo.findByUserIdAndAssignedCameraId(userId, camId)
                .orElseGet(() -> assignRepo.save(CameraAssign.builder()
                        .userId(userId)
                        .assignedCameraId(camId)
                        .build()));

        return info;
    }

    /** 오너만 수정 허용 */
    @Transactional
    public CameraInfos updateCameraOwned(Long cameraId, Long userId, CameraUpdateReq req) {
        var c = infoRepo.findById(cameraId)
                .orElseThrow(() -> new IllegalArgumentException("camera not found: " + cameraId));
        if (!userId.equals(c.getOwnerUserId())) {
            throw new IllegalStateException("FORBIDDEN: not owner");
        }
        if (req.cameraName() != null) c.setCameraName(req.cameraName());
        if (req.coordx() != null)     c.setCoordx(req.coordx());
        if (req.coordy() != null)     c.setCoordy(req.coordy());
        if (req.isAnalisis() != null) c.setAnalisis(req.isAnalisis());
        return infoRepo.save(c);
    }

    /** 오너면 하드삭제(모든 매핑 제거 후 마스터 삭제), 비오너면 내 매핑만 해제 */
    @Transactional
    public void deleteOrUnassign(Long cameraId, Long userId) {
        var c = infoRepo.findById(cameraId)
                .orElseThrow(() -> new IllegalArgumentException("camera not found: " + cameraId));

        if (userId.equals(c.getOwnerUserId())) {
            assignRepo.deleteByAssignedCameraId(cameraId);
            infoRepo.deleteById(cameraId);
        } else {
            assignRepo.deleteByUserIdAndAssignedCameraId(userId, cameraId);
        }
    }

    /** 프론트 전송용 요청 DTO */
    public record AssignReq(String cctvname, String cctvurl, Double coordx, Double coordy, String cctvformat) {}
    public record CameraUpdateReq(String cameraName, Double coordx, Double coordy, Boolean isAnalisis) {}
}
