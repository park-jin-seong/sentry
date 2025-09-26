package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import lombok.Data;


@Data
public class CameraInfosDTO {
    private Long cameraId;
    private String cameraName;
    private String cctvUrl;
    private double coordx;
    private double coordy;
    private boolean isAnalisis;
    private Long analysisServerId;

    public CameraInfosDTO(CameraInfos cameraInfos) {
        this.cameraId = cameraInfos.getCameraId();
        this.cameraName = cameraInfos.getCameraName();
        this.cctvUrl = cameraInfos.getCctvUrl();
        this.coordx = cameraInfos.getCoordx();
        this.coordy = cameraInfos.getCoordy();
        this.isAnalisis = cameraInfos.isAnalisis();
        if (cameraInfos.getAnalysisServer() != null) {
            this.analysisServerId = Long.valueOf(cameraInfos.getAnalysisServer().getServerId());
        }
    }
}