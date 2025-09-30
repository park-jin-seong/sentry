package com.sentry.sentry.image;

import com.sentry.sentry.entity.EventResult;

import java.time.LocalDateTime;
import java.util.List;


public interface CustomEventResultRepository {
    List<EventResult> findBySearchCriteria(List<Long> cameraIds, List<Long> classIds, LocalDateTime startDateTime, LocalDateTime endDateTime);


}
