package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QEventResult is a Querydsl query type for EventResult
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QEventResult extends EntityPathBase<EventResult> {

    private static final long serialVersionUID = 516342169L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QEventResult eventResult = new QEventResult("eventResult");

    public final QCameraInfos cameraInfo;

    public final NumberPath<Long> classId = createNumber("classId", Long.class);

    public final DateTimePath<java.time.LocalDateTime> eventOccurTime = createDateTime("eventOccurTime", java.time.LocalDateTime.class);

    public final NumberPath<Long> eventResultId = createNumber("eventResultId", Long.class);

    public final QServerInfo serverInfo;

    public final StringPath thumbnailPath = createString("thumbnailPath");

    public QEventResult(String variable) {
        this(EventResult.class, forVariable(variable), INITS);
    }

    public QEventResult(Path<? extends EventResult> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QEventResult(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QEventResult(PathMetadata metadata, PathInits inits) {
        this(EventResult.class, metadata, inits);
    }

    public QEventResult(Class<? extends EventResult> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.cameraInfo = inits.isInitialized("cameraInfo") ? new QCameraInfos(forProperty("cameraInfo"), inits.get("cameraInfo")) : null;
        this.serverInfo = inits.isInitialized("serverInfo") ? new QServerInfo(forProperty("serverInfo")) : null;
    }

}

