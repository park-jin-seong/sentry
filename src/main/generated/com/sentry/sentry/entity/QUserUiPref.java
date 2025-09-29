package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QUserUiPref is a Querydsl query type for UserUiPref
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUserUiPref extends EntityPathBase<UserUiPref> {

    private static final long serialVersionUID = 405866496L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QUserUiPref userUiPref = new QUserUiPref("userUiPref");

    public final NumberPath<Integer> chatOpacity = createNumber("chatOpacity", Integer.class);

    public final NumberPath<Integer> chatWidthPct = createNumber("chatWidthPct", Integer.class);

    public final QUserinfo user;

    public final NumberPath<Long> userId = createNumber("userId", Long.class);

    public QUserUiPref(String variable) {
        this(UserUiPref.class, forVariable(variable), INITS);
    }

    public QUserUiPref(Path<? extends UserUiPref> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QUserUiPref(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QUserUiPref(PathMetadata metadata, PathInits inits) {
        this(UserUiPref.class, metadata, inits);
    }

    public QUserUiPref(Class<? extends UserUiPref> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.user = inits.isInitialized("user") ? new QUserinfo(forProperty("user")) : null;
    }

}

