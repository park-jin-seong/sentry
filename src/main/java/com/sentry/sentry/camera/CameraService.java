package com.sentry.sentry.camera;

import com.sentry.sentry.camera.dto.CameraDtos;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.camera.repo.CameraAssignRepository;
import com.sentry.sentry.camera.repo.CameraInfoRepository;
import com.sentry.sentry.entity.CameraInfos;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CameraService {

    private final CameraInfoRepository infoRepo;
    private final CameraAssignRepository assignRepo;

    @Transactional
    public CameraDtos.Item createAndAssign(CameraDtos.CreateReq req) {
        // 1) camerainfos에 (cctvUrl 기준) upsert
        CameraInfos info = infoRepo.findByCctvUrl(req.getCctvurl())
                .orElseGet(() -> infoRepo.save(CameraInfos.builder()
                        .cameraName(req.getName())
                        .cctvUrl(req.getCctvurl())
                        .coordx(req.getCoordx())
                        .coordy(req.getCoordy())
                        .isAnalisis(false)    // 필드명이 analysis로 깔끔
                        .build()));

        // 2) cameraassign 에 사용자-카메라 연결
        CameraAssign assign = assignRepo.save(CameraAssign.builder()
                .userId(req.getUserId())
                .assignedCameraId(info.getCameraId())
                .build());

        return CameraDtos.Item.builder()
                .id(assign.getId()) // assignId
                .cameraId(info.getCameraId())
                .name(info.getCameraName())
                .cctvurl(info.getCctvUrl())
                .coordx(info.getCoordx())
                .coordy(info.getCoordy())
                .build();
    }

    @Transactional(readOnly = true)
    public List<CameraDtos.Item> listByUser(Long userId) {
        return assignRepo.findAssignedCameraRows(userId).stream()
                .map(row -> {
                    Long cameraId = ((Number) row[0]).longValue();
                    String name   = (String) row[1];
                    String url    = (String) row[2];
                    float x      = (float) row[3];
                    float y      = (float) row[4];
                    Long assignId = ((Number) row[5]).longValue();

                    return CameraDtos.Item.builder()
                            .id(assignId)
                            .cameraId(cameraId)
                            .name(name)
                            .cctvurl(url)
                            .coordx(x)
                            .coordy(y)
                            .build();
                }).toList();
    }

    @Transactional
    public void deleteAssign(Long assignId, Long userId) {
        assignRepo.deleteByIdAndUserId(assignId, userId);
    }
}
