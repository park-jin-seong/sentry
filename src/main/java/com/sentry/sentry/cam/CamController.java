package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.socket.ServerInfoService;
import com.sentry.sentry.socket.SocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/cam")
public class CamController {
    private final CamService camService;
    private final SocketService socketService;
    private final ServerInfoService serverInfoService;

    @GetMapping("/{userId}")
    public String getCam(@PathVariable("userId") Long userId){
        ServerInfo serverInfo = serverInfoService.getServerInfo("Middle");
        Long currentUserId = 1L;
        List<Long> camIdList = camService.getCam(1);
        String serverIp = serverInfo.getServerIp();
        int serverPort = serverInfo.getServerPort();
        System.out.println("Server IP: " + serverIp);
        System.out.println("Server Port: " + serverPort);
        System.out.println("currentUserId = " + currentUserId);
        System.out.println("camIdList = " + camIdList);

        String RTSPURL = socketService.getRTSPURL(serverIp, serverPort, currentUserId, camIdList);
        System.out.println("RTSPURL: " + RTSPURL);
        return RTSPURL;
    }
}
