package com.sentry.sentry.socket;

import com.sentry.sentry.entity.ServerInfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ServerInfoRepository extends JpaRepository<ServerInfo, Integer> {
    ServerInfo getServerInfoByServerType(String serverType);
}
