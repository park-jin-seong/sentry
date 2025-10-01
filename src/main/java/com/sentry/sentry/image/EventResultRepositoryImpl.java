package com.sentry.sentry.image;

import com.querydsl.core.BooleanBuilder;
import com.querydsl.core.types.Order;
import com.querydsl.core.types.OrderSpecifier;
import com.querydsl.jpa.impl.JPAQueryFactory;
import com.sentry.sentry.entity.EventResult;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

import static com.sentry.sentry.entity.QEventResult.eventResult;


@Repository
@RequiredArgsConstructor
public class EventResultRepositoryImpl implements CustomEventResultRepository {

    private final JPAQueryFactory queryFactory;
    private static final int PAGE_SIZE = 9;

    @Override
    public List<EventResult> findBySearchCriteria(
            List<Long> cameraIds,
            List<Long> classIds,
            LocalDateTime startDateTime,
            LocalDateTime endDateTime,
            Long cursorId,
            LocalDateTime cursorTime,
            String direction
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

        String normalizedDirection = direction.toLowerCase();

        OrderSpecifier<LocalDateTime> timeOrder;
        OrderSpecifier<Long> idOrder;

        if ("next".equals(normalizedDirection)) {
            timeOrder = new OrderSpecifier<>(Order.DESC, eventResult.eventOccurTime);
            idOrder = new OrderSpecifier<>(Order.ASC, eventResult.eventResultId);

            if (cursorId != null && cursorTime != null) {
                builder.and(eventResult.eventOccurTime.lt(cursorTime)
                        .or(eventResult.eventOccurTime.eq(cursorTime)
                                .and(eventResult.eventResultId.gt(cursorId))));
            }

        } else if ("prev".equals(normalizedDirection)) {

            timeOrder = new OrderSpecifier<>(Order.ASC, eventResult.eventOccurTime);
            idOrder = new OrderSpecifier<>(Order.DESC, eventResult.eventResultId);

            if (cursorId != null && cursorTime != null) {
                builder.and(eventResult.eventOccurTime.gt(cursorTime)
                        .or(eventResult.eventOccurTime.eq(cursorTime)
                                .and(eventResult.eventResultId.lt(cursorId))));
            }

        } else {
            timeOrder = new OrderSpecifier<>(Order.DESC, eventResult.eventOccurTime);
            idOrder = new OrderSpecifier<>(Order.ASC, eventResult.eventResultId);
        }

        List<EventResult> results = queryFactory
                .selectFrom(eventResult)
                .where(builder)
                .orderBy(timeOrder, idOrder)
                .limit(PAGE_SIZE + 1)
                .fetch();

        if ("prev".equals(normalizedDirection)) {
            Collections.reverse(results);
        }

        return results;
    }
}