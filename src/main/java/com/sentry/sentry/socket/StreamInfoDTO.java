package com.sentry.sentry.socket;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StreamInfoDTO {
    private Long userId;
    private List<Long> cameraIds;

    public StreamInfoDTO(Long userId, List<Long> cameraIds) {
        this.userId = userId;
        this.cameraIds = cameraIds;
    }

}
