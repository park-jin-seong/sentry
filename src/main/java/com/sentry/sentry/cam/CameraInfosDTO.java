// src/main/java/com/sentry/sentry/cam/CameraInfosDTO.java
package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
@Data
public class CameraInfosDTO {
    private Long cameraId;
    private String cameraName;
    private String cctvUrl;
    private double coordx;
    private double coordy;
    private Boolean isAnalisis;

    private Long ownerUserId;   // ← 반드시 채워서 내려오기
    private boolean isOwner;    // 내 소유 여부
    private String ownerName;   // ← 여기로 업로더 표시

    public CameraInfosDTO(CameraInfos c, Long currentUserId) {
        this.cameraId = c.getCameraId();
        this.cameraName = c.getCameraName();
        this.cctvUrl = c.getCctvUrl();
        this.coordx = c.getCoordx();
        this.coordy = c.getCoordy();
        this.isAnalisis = c.isAnalisis();
        this.ownerUserId = c.getOwnerUserId();
        this.isOwner = (currentUserId != null && currentUserId.equals(c.getOwnerUserId()));
    }

    public CameraInfosDTO(CameraInfos c) { this(c, null); }
}
