package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class CamService {
    private final CamRepository camRepository;
    private final CameraInfosRepository cameraInfosRepository;

    public List<Long> getCam(long userId){
      return camRepository.findAssignedCameraIdByUserId(userId);
    }

    public List<CameraInfos> getCameraInfos(List<Long> cameraIds) {
        return cameraInfosRepository.findByCameraIdIn(cameraIds);
    }

    public CameraInfos addCamera(CameraInfosDTO dto, Long userId) {
        CameraInfos cam = CameraInfos.builder()
                .cameraName(dto.getCameraName())
                .cctvUrl(dto.getCctvUrl())
                .coordx(dto.getCoordx())
                .coordy(dto.getCoordy())
                .isAnalisis(dto.getIsAnalisis()) // ✅ boolean getter 사용 가능
                .ownerUserId(userId)
                .build();
        return cameraInfosRepository.save(cam);
    }


    public List<CameraInfos> findAll() {
        return cameraInfosRepository.findAll();
    }
    // ✅ 새로 추가
    public Optional<CameraInfos> findById(Long id) {
        return cameraInfosRepository.findById(id);
    }

    // ✅ 새로 추가
    public CameraInfos save(CameraInfos cam) {
        return cameraInfosRepository.save(cam);
    }

    // ✅ 새로 추가
    public void delete(CameraInfos cam) {
        cameraInfosRepository.delete(cam);
    }
}
