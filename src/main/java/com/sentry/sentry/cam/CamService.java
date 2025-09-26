package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.CameraInfos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

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

    public List<CameraInfos> getCameraInfosByName(String cameraName) {
        return cameraInfosRepository.findByCameraNameContaining(cameraName);
    }
}
