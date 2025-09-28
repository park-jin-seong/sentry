package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraAssignRepository;
import com.sentry.sentry.cam.CameraInfosDTO;
import com.sentry.sentry.cam.CameraInfosRepository;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.entity.UserAuthorityRepository;
import com.sentry.sentry.entity.UserinfoRepository; // ✅ 추가
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraInfosRepository infoRepo;
    private final CameraAssignRepository assignRepo;
    private final UserAuthorityRepository userAuthorityRepository;
    private final UserinfoRepository userinfoRepository; // 주입 추가

    /** 사용자에게 할당된 카메라 목록 */
    @Transactional(readOnly = true)
    public List<CameraInfos> listAssigned(Long userId) {
        var ids = assignRepo.findByUserId(userId).stream()
                .map(CameraAssign::getAssignedCameraId)
                .toList();
        return ids.isEmpty() ? List.of() : infoRepo.findByCameraIdIn(ids);
    }

    @Transactional
    public CameraInfos addCamera(CameraInfosDTO dto, Long creatorUserId) {
        CameraInfos cam = CameraInfos.builder()
                .cameraName(dto.getCameraName())
                .cctvUrl(dto.getCctvUrl())
                .coordx(dto.getCoordx())
                .coordy(dto.getCoordy())
                .isAnalisis(Boolean.TRUE.equals(dto.getIsAnalisis()))
                .ownerUserId(creatorUserId)
                .build();

        CameraInfos saved = infoRepo.save(cam);

        List<Long> privilegedUserIds =
                userAuthorityRepository.findUserIdsByAuthorities(List.of("MASTER", "OWNER"));

        var targetUserIds = privilegedUserIds.stream()
                .collect(java.util.stream.Collectors.toSet());
        targetUserIds.add(creatorUserId);

        List<CameraAssign> assigns = targetUserIds.stream()
                .filter(uid -> !assignRepo.existsByUserIdAndAssignedCameraId(uid, saved.getCameraId()))
                .map(uid -> CameraAssign.builder()
                        .assignedCameraId(saved.getCameraId())
                        .userId(uid)
                        .build())
                .toList();

        if (!assigns.isEmpty()) assignRepo.saveAll(assigns);

        return saved;
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

    /** 오너면 하드삭제, 비오너면 내 매핑만 해제 */
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

    @Transactional
    public void assignCamera(Long userId, Long cameraId) {
        if (!assignRepo.existsByUserIdAndAssignedCameraId(userId, cameraId)) {
            var ca = CameraAssign.builder()
                    .userId(userId)
                    .assignedCameraId(cameraId)
                    .build();
            assignRepo.save(ca);
        }
    }

    @Transactional(readOnly = true)
    public List<Long> listAssignedIds(Long userId) {
        return assignRepo.findByUserId(userId).stream()
                .map(CameraAssign::getAssignedCameraId)
                .toList();
    }

    /** username 기반 해제: 서비스에서 트랜잭션으로 처리 */
    @Transactional
    public void unassignByUsername(String username, Long cameraId) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) throw new IllegalArgumentException("user not found");
        assignRepo.deleteByUserIdAndAssignedCameraId(userOpt.get().getId(), cameraId);
    }
}
