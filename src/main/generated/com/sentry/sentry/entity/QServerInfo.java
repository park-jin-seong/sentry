package com.sentry.sentry.entity;

import static com.querydsl.core.types.PathMetadataFactory.*;

import com.querydsl.core.types.dsl.*;

import com.querydsl.core.types.PathMetadata;
import javax.annotation.processing.Generated;
import com.querydsl.core.types.Path;


/**
 * QServerInfo is a Querydsl query type for ServerInfo
 */
@Generated("com.querydsl.codegen.DefaultEntitySerializer")
public class QServerInfo extends EntityPathBase<ServerInfo> {

    private static final long serialVersionUID = 1236363279L;

    public static final QServerInfo serverInfo = new QServerInfo("serverInfo");

    public final StringPath osId = createString("osId");

    public final StringPath osPw = createString("osPw");

    public final NumberPath<Integer> serverId = createNumber("serverId", Integer.class);

    public final StringPath serverIp = createString("serverIp");

    public final NumberPath<Integer> serverPort = createNumber("serverPort", Integer.class);

    public final StringPath serverType = createString("serverType");

    public QServerInfo(String variable) {
        super(ServerInfo.class, forVariable(variable));
    }

    public QServerInfo(Path<? extends ServerInfo> path) {
        super(path.getType(), path.getMetadata());
    }

    public QServerInfo(PathMetadata metadata) {
        super(ServerInfo.class, metadata);
    }

}

