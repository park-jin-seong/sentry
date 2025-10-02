package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QCameraInfos is a Querydsl query type for CameraInfos
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCameraInfos extends EntityPathBase<CameraInfos> {

    private static final long serialVersionUID = -1804655710L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QCameraInfos cameraInfos = new QCameraInfos("cameraInfos");

    public final QServerInfo analysisServer;

    public final NumberPath<Long> cameraId = createNumber("cameraId", Long.class);

    public final StringPath cameraName = createString("cameraName");

    public final StringPath cctvUrl = createString("cctvUrl");

    public final NumberPath<Double> coordx = createNumber("coordx", Double.class);

    public final NumberPath<Double> coordy = createNumber("coordy", Double.class);

    public final BooleanPath isAnalisis = createBoolean("isAnalisis");

    public final NumberPath<Long> ownerUserId = createNumber("ownerUserId", Long.class);

    public QCameraInfos(String variable) {
        this(CameraInfos.class, forVariable(variable), INITS);
    }

    public QCameraInfos(Path<? extends CameraInfos> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QCameraInfos(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QCameraInfos(PathMetadata metadata, PathInits inits) {
        this(CameraInfos.class, metadata, inits);
    }

    public QCameraInfos(Class<? extends CameraInfos> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.analysisServer = inits.isInitialized("analysisServer") ? new QServerInfo(forProperty("analysisServer")) : null;
    }

}

