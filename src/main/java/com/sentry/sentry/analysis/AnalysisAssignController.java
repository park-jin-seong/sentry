// src/main/java/com/sentry/sentry/analysis/AnalysisAssignController.java
package com.sentry.sentry.analysis;

import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.socket.ServerInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.io.*;
import java.net.Socket;
import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/analysis")
public class AnalysisAssignController {

    private final AnalysisAssignService service;
    private final ServerInfoService serverInfoService;

    private boolean SendNotice(String serverIp, int port, String msg) {
        try (Socket socket = new Socket(serverIp, port);
             DataOutputStream dos = new DataOutputStream(socket.getOutputStream())) {

            byte[] triggerBytes = (msg + "\n").getBytes("UTF-8");  // 개행 포함
            dos.write(triggerBytes);
            dos.flush();

        } catch (Exception e) {
            System.out.println(e.getMessage());
            return false;
        }
        return true;
    }

    @GetMapping("/cameras")
    public List<AnalysisAssignService.CameraDto> list(@RequestParam Long serverId) {
        return service.listAssignableCameras(serverId);
    }

    @PostMapping("/serverCheck")
    public Map<String,Object> serverCheck(@RequestBody ServerCheckReq req) {

        String serverIp = null;
        Integer port = null;

        List<ServerInfo> serverInfo = serverInfoService.getAllServersByServerType("Analysis");

        for (ServerInfo server : serverInfo) {
            if (server.getServerId().intValue() == req.serverId) {
                serverIp = server.getServerIp();
                port = server.getServerPort();
                break;
            }
        }

        boolean restart = SendNotice(serverIp, port, "restart");
        return Map.of("restart", restart, "serverIp", serverIp, "port", port);
    }
    public record ServerCheckReq(Long serverId) {}


    @PostMapping("/assign")
    public Map<String,Object> assign(@RequestBody AssignReq req) throws IOException {

        if (req == null || req.serverId == null || req.cameraIds == null || req.cameraIds.isEmpty()) {
            return Map.of("error", "serverId/cameraIds required");
        }
        int updated = service.assignCamerasToServer(req.serverId, req.cameraIds);
        return Map.of("updated", updated);
    }

    public record AssignReq(Long serverId, List<Long> cameraIds) {}


    @DeleteMapping("/assign")
    public Map<String,Object> unassign(@RequestBody AssignReq req) {
        if (req == null || req.cameraIds == null || req.cameraIds.isEmpty()) {
            return Map.of("error", "cameraIds required");
        }
        int updated = service.unassignCamerasFromServer(req.serverId, req.cameraIds);

        return Map.of("updated", updated);
    }


}
