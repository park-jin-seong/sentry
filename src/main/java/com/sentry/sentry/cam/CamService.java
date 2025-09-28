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
    private final CameraAssignRepository cameraAssignRepository;   // ✅ sentry_client (추가)
    private final UserAuthorityRepository userAuthorityRepository; // ✅ 주입

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

    /* ==========================
       아래는 권한 체크 포함 유틸
       ========================== */

    /** 오너만 수정 */
    @Transactional
    public CameraInfos updateCamera(Long cameraId, Long requesterId, CameraInfosDTO dto) {
        CameraInfos cam = cameraInfosRepository.findById(cameraId)
                .orElseThrow(() -> new IllegalArgumentException("카메라가 존재하지 않습니다: " + cameraId));

        if (!Objects.equals(cam.getOwnerUserId(), requesterId)) {
            throw new IllegalStateException("소유자만 수정할 수 있습니다.");
        }

        if (dto.getCameraName() != null) cam.setCameraName(dto.getCameraName());
        if (dto.getCctvUrl() != null)   cam.setCctvUrl(dto.getCctvUrl());
        cam.setCoordx(dto.getCoordx());
        cam.setCoordy(dto.getCoordy());
        if (dto.getIsAnalisis() != null) cam.setAnalisis(dto.getIsAnalisis());

        return cameraInfosRepository.save(cam);
    }

    /** 비오너: 내 매핑만 해제 */
    @Transactional
    public void unassign(Long cameraId, Long userId) {
        cameraAssignRepository.deleteByUserIdAndAssignedCameraId(userId, cameraId);
    }

    /** 오너: 모든 매핑 + 마스터 하드삭제 */
    @Transactional
    public void deleteHard(Long cameraId, Long requesterId) {
        CameraInfos cam = cameraInfosRepository.findById(cameraId)
                .orElseThrow(() -> new IllegalArgumentException("카메라가 존재하지 않습니다: " + cameraId));

        if (!Objects.equals(cam.getOwnerUserId(), requesterId)) {
            throw new IllegalStateException("소유자만 삭제할 수 있습니다.");
        }

        // 매핑 전부 삭제
        cameraAssignRepository.deleteByAssignedCameraId(cameraId);
        // 마스터 삭제
        cameraInfosRepository.delete(cam);
    }

    public List<CameraInfos> getCameraInfosByName(String cameraName) {
        return cameraInfosRepository.findByCameraNameContaining(cameraName);
    }

}
