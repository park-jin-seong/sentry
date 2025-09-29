package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QCameraAssign is a Querydsl query type for CameraAssign
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QCameraAssign extends EntityPathBase<CameraAssign> {

    private static final long serialVersionUID = -333786510L;

    public static final QCameraAssign cameraAssign = new QCameraAssign("cameraAssign");

    public final NumberPath<Long> assignedCameraId = createNumber("assignedCameraId", Long.class);

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QCameraAssign(String variable) {
        super(CameraAssign.class, forVariable(variable));
    }

    public QCameraAssign(Path<? extends CameraAssign> path) {
        super(path.getType(), path.getMetadata());
    }

    public QCameraAssign(PathMetadata metadata) {
        super(CameraAssign.class, metadata);
    }

}

