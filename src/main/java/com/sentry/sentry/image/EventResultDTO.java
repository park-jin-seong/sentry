package com.sentry.sentry.image;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class EventResultDTO {
    private Long cameraId;
    private Long classId;
    private LocalDateTime eventOccurTime;
}
