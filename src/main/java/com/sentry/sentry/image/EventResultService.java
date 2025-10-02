package com.sentry.sentry.image;

import com.sentry.sentry.entity.EventResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class EventResultService {
    private final EventResultRepository eventResultRepository;

    public List<EventResult> getEventResultList(Long cameraId){
        return eventResultRepository.findByCameraInfo_CameraId(cameraId);
    }

    public List<EventResult> getEventResultList(
            List<Long> cameraIds,
            List<Long> classIds,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            Long cursorId,
            LocalDateTime cursorTime,
            String direction
    ) {
        return eventResultRepository.findBySearchCriteria(
                cameraIds,
                classIds,
                startDateTime,
                endDateTime,
                cursorId,
                cursorTime,
                direction
        );
    }
}