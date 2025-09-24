package com.sentry.sentry.socket;

import com.sentry.sentry.entity.ServerInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ServerInfoService {
    private final ServerInfoRepository serverInfoRepository;
    public ServerInfo getServerInfo(String serverType){
        return serverInfoRepository.getServerInfoByServerType(serverType);
    }
}
