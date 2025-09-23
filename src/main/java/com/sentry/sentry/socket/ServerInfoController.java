package com.sentry.sentry.socket;

import com.sentry.sentry.entity.ServerInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/serverInfo")
public class ServerInfoController {
    private final ServerInfoService serverInfoService;
    @GetMapping("/middle")
    public ServerInfo getServerInfo(){
        return serverInfoService.getServerInfo("Middle");
    }
}
