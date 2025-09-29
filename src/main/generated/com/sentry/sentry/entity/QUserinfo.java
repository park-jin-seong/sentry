package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;
import com.querydsl.core.types.dsl.PathInits;


/**
 * QUserinfo is a Querydsl query type for Userinfo
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QUserinfo extends EntityPathBase<Userinfo> {

    private static final long serialVersionUID = -1464896521L;

    public static final QUserinfo userinfo = new QUserinfo("userinfo");

    public final NumberPath<Long> id = createNumber("id", Long.class);

    public final StringPath nickname = createString("nickname");

    public final ListPath<RoomUser, QRoomUser> roomUsers = this.<RoomUser, QRoomUser>createList("roomUsers", RoomUser.class, QRoomUser.class, PathInits.DIRECT2);

    public final StringPath username = createString("username");

    public final StringPath userpassword = createString("userpassword");

    public QUserinfo(String variable) {
        super(Userinfo.class, forVariable(variable));
    }

    public QUserinfo(Path<? extends Userinfo> path) {
        super(path.getType(), path.getMetadata());
    }

    public QUserinfo(PathMetadata metadata) {
        super(Userinfo.class, metadata);
    }

}

