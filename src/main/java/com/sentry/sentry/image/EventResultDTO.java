package com.sentry.sentry.image;

import com.sentry.sentry.entity.EventResult;
import lombok.Data;
import java.time.LocalDateTime;

@Data
public class EventResultDTO {
    private Long eventResultId;
    private Long cameraId;
    private int serverId;
    private Long classId;
    private LocalDateTime eventOccurTime;

    public EventResultDTO(EventResult eventResult) {
        this.eventResultId = eventResult.getEventResultId();
        this.cameraId = eventResult.getCameraInfo().getCameraId();
        this.serverId = eventResult.getServerInfo().getServerId();
        this.classId = eventResult.getClassId();
        this.eventOccurTime = eventResult.getEventOccurTime();
    }
}