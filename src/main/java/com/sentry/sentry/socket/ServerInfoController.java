package com.sentry.sentry.socket;

import com.sentry.sentry.entity.ServerInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping({"/api/serverinfos", "/serverInfo"})
public class ServerInfoController {
    private final ServerInfoService serverInfoService;
    @GetMapping("/middle")
    public ServerInfo getServerInfo(){
        return serverInfoService.getServerInfo("Middle");
    }

    @GetMapping("/by-type")
    public ServerInfo getByType(@RequestParam String type) {
        return serverInfoService.getServerInfo(type);
    }

    /** 전체 서버 목록 조회 */
    @GetMapping({"", "/Analysis"})
    public List<ServerInfo> getAnalysis() {
        return serverInfoService.getAllServersByServerType("Analysis");

    }

}
