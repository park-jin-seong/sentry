package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.security.CustomUserDetails;
import com.sentry.sentry.socket.ServerInfoService;
import com.sentry.sentry.socket.SocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cam")
public class CamController {
    private final CamService camService;
    private final SocketService socketService;
    private final ServerInfoService serverInfoService;


    @GetMapping("/{userId}")
    public String getCam(@PathVariable Long userId){
        ServerInfo serverInfo = serverInfoService.getServerInfo("Middle");
        List<Long> camIdList = camService.getCam(userId);
        String serverIp = serverInfo.getServerIp();
        int serverPort = serverInfo.getServerPort();
        System.out.println("Server IP: " + serverIp);
        System.out.println("Server Port: " + serverPort);
        System.out.println("currentUserId = " + userId);
        System.out.println("camIdList = " + camIdList);

        String RTSPURL = socketService.getRTSPURL(serverIp, serverPort, userId, camIdList);
        System.out.println("RTSPURL: " + RTSPURL);
        return RTSPURL;
    }

    @GetMapping("/list-byUserId")
    public List<CameraInfosDTO> getAllCameraInfos(@RequestParam Long userId) {

        List<Long> camIdList = camService.getCam(userId);

        List<CameraInfos> allCameraInfos = camService.getCameraInfos(camIdList);
        List<CameraInfosDTO> allCameraInfosDTO = allCameraInfos.stream()
                .map(CameraInfosDTO::new)
                .collect(Collectors.toList());
        return allCameraInfosDTO;
    }

    @GetMapping("/list-byName")
    public List<CameraInfosDTO> getCameraInfosByName(@RequestParam(required = false) String cameraName) {
        List<CameraInfos> allCameraInfos = camService.getCameraInfosByName(cameraName);
        List<CameraInfosDTO> allCameraInfosDTO = allCameraInfos.stream()
                .map(CameraInfosDTO::new)
                .collect(Collectors.toList());

        return allCameraInfosDTO;
    }
}
