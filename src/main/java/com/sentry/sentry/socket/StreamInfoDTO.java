package com.sentry.sentry.socket;

import lombok.Data;

import java.util.ArrayList;
import java.util.List;

@Data
public class StreamInfoDTO {
    private Long userId;
    private List<Long> cameraIds;
    private int x = 3;
    private int y = 3;
    public StreamInfoDTO(Long userId, List<Long> cameraIds) {
        this.userId = userId;
        this.cameraIds = cameraIds;
    }

}
