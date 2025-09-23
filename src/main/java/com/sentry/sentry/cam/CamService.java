package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CamService {
    private final CamRepository camRepository;

    public List<Long> getCam(long userId){
      return camRepository.findAssignedCameraIdByUserId(userId);
    }

}
