package com.sentry.sentry.socket;

import com.sentry.sentry.entity.ServerInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ServerInfoService {
    private final ServerInfoRepository serverInfoRepository;
    public ServerInfo getServerInfo(String serverType){
        return serverInfoRepository.getServerInfoByServerType(serverType);
    }


    public List<ServerInfo> getAllServers() {
        return serverInfoRepository.findAll();
    }

    public List<ServerInfo> getAllServersByServerType(String serverType){
        return serverInfoRepository.getServerInfosByServerType(serverType);
    }
}
