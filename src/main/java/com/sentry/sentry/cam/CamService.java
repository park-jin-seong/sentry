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
    private final CamRepository camRepository;
    private final CameraInfosRepository cameraInfosRepository;
    private final CameraAssignRepository cameraAssignRepository;
    private final UserAuthorityRepository userAuthorityRepository;

    public List<Long> getCam(long userId){
        return camRepository.findAssignedCameraIdByUserId(userId);
    }

    public List<CameraInfos> getCameraInfos(List<Long> cameraIds) {
        return cameraInfosRepository.findByCameraIdIn(cameraIds);
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

        CameraInfos saved = cameraInfosRepository.save(cam);

        List<Long> privilegedUserIds =
                userAuthorityRepository.findUserIdsByAuthorities(List.of("MASTER", "OWNER"));

        Set<Long> targetUserIds = new HashSet<>(privilegedUserIds);
        targetUserIds.add(creatorUserId);

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
