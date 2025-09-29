package com.sentry.sentry.image;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.sentry.sentry.entity.EventResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

import static com.sentry.sentry.entity.QEventResult.eventResult;


@Repository
@RequiredArgsConstructor
public class EventResultRepositoryImpl implements CustomEventResultRepository {

    private final JPAQueryFactory queryFactory;

    @Override
    public List<EventResult> findBySearchCriteria(
            List<Long> cameraIds,
            List<Long> classIds,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime
    ) {
        BooleanBuilder builder = new BooleanBuilder();

        if (cameraIds != null && !cameraIds.isEmpty()) {
            builder.and(eventResult.cameraInfo.cameraId.in(cameraIds));
        }

        if (classIds != null && !classIds.isEmpty()) {
            builder.and(eventResult.classId.in(classIds));
        }

        if (startDateTime != null) {
            builder.and(eventResult.eventOccurTime.goe(startDateTime));
        }

        if (endDateTime != null) {
            builder.and(eventResult.eventOccurTime.loe(endDateTime));
        }

        return queryFactory
                .selectFrom(eventResult)
                .where(builder)
                .fetch();
    }


}