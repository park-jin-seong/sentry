package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.entity.UserAuthorityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import jakarta.transaction.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class CamService {
    private final CamRepository camRepository;                     // 그대로 유지 (배정 ID 조회)
    private final CameraInfosRepository cameraInfosRepository;     // sentry_server
    private final CameraAssignRepository cameraAssignRepository;   // sentry_client (추가)
    private final UserAuthorityRepository userAuthorityRepository; // 주입

    /** 그대로 유지 */
    public List<Long> getCam(long userId){
        return camRepository.findAssignedCameraIdByUserId(userId);
    }

    /** 그대로 유지 */
    public List<CameraInfos> getCameraInfos(List<Long> cameraIds) {
        return cameraInfosRepository.findByCameraIdIn(cameraIds);
    }
    /** 카메라 생성 + owner 매핑(cameraassign) 추가 */
    @Transactional
    public CameraInfos addCamera(CameraInfosDTO dto, Long creatorUserId) {
        // 1) 카메라 저장
        CameraInfos cam = CameraInfos.builder()
                .cameraName(dto.getCameraName())
                .cctvUrl(dto.getCctvUrl())
                .coordx(dto.getCoordx())
                .coordy(dto.getCoordy())
                .isAnalisis(Boolean.TRUE.equals(dto.getIsAnalisis()))
                .ownerUserId(creatorUserId)
                .build();

        CameraInfos saved = cameraInfosRepository.save(cam);

        // 2) MASTER/OWNER 권한 가진 모든 userId 조회
        List<Long> privilegedUserIds =
                userAuthorityRepository.findUserIdsByAuthorities(List.of("MASTER", "OWNER"));

        // 3) creatorUserId도 포함
        Set<Long> targetUserIds = new HashSet<>(privilegedUserIds);
        targetUserIds.add(creatorUserId);

        // 4) cameraassign에 전부 매핑 (중복 체크)
        List<CameraAssign> assigns = targetUserIds.stream()
                .filter(uid -> !cameraAssignRepository.existsByUserIdAndAssignedCameraId(uid, saved.getCameraId()))
                .map(uid -> CameraAssign.builder()
                        .userId(uid)
                        .assignedCameraId(saved.getCameraId())
                        .build()
                )
                .toList();

        if (!assigns.isEmpty()) {
            cameraAssignRepository.saveAll(assigns);
        }

        return saved;
    }

    public List<CameraInfos> findAll() {
        return cameraInfosRepository.findAll();
    }

    public Optional<CameraInfos> findById(Long id) {
        return cameraInfosRepository.findById(id);
    }

    public CameraInfos save(CameraInfos cam) {
        return cameraInfosRepository.save(cam);
    }

    public void delete(CameraInfos cam) {
        cameraInfosRepository.delete(cam);
    }

    public List<CameraInfos> getCameraInfosByName(String cameraName) {
        return cameraInfosRepository.findByCameraNameContaining(cameraName);
    }


}
