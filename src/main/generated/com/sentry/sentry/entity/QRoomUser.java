package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QRoomUser is a Querydsl query type for RoomUser
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QRoomUser extends EntityPathBase<RoomUser> {

    private static final long serialVersionUID = -1372324796L;

    private static final PathInits INITS = PathInits.DIRECT2;

    public static final QRoomUser roomUser = new QRoomUser("roomUser");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final QMessage lastReadMessage;

    public final QRoom room;

    public final QUserinfo user;

    public QRoomUser(String variable) {
        this(RoomUser.class, forVariable(variable), INITS);
    }

    public QRoomUser(Path<? extends RoomUser> path) {
        this(path.getType(), path.getMetadata(), PathInits.getFor(path.getMetadata(), INITS));
    }

    public QRoomUser(PathMetadata metadata) {
        this(metadata, PathInits.getFor(metadata, INITS));
    }

    public QRoomUser(PathMetadata metadata, PathInits inits) {
        this(RoomUser.class, metadata, inits);
    }

    public QRoomUser(Class<? extends RoomUser> type, PathMetadata metadata, PathInits inits) {
        super(type, metadata, inits);
        this.lastReadMessage = inits.isInitialized("lastReadMessage") ? new QMessage(forProperty("lastReadMessage"), inits.get("lastReadMessage")) : null;
        this.room = inits.isInitialized("room") ? new QRoom(forProperty("room")) : null;
        this.user = inits.isInitialized("user") ? new QUserinfo(forProperty("user")) : null;
    }

}

