// src/main/java/com/sentry/sentry/analysis/AnalysisAssignController.java
package com.sentry.sentry.analysis;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/analysis")
public class AnalysisAssignController {

    private final AnalysisAssignService service;

    @GetMapping("/cameras")
    public List<AnalysisAssignService.CameraDto> list(@RequestParam Long serverId) {
        return service.listAssignableCameras(serverId);
    }

    @PostMapping("/assign")
    public Map<String,Object> assign(@RequestBody AssignReq req) {
        if (req == null || req.serverId == null || req.cameraIds == null || req.cameraIds.isEmpty()) {
            return Map.of("error", "serverId/cameraIds required");
        }
        int updated = service.assignCamerasToServer(req.serverId, req.cameraIds);
        return Map.of("updated", updated);
    }

    public record AssignReq(Long serverId, List<Long> cameraIds) {}

    // com.sentry.sentry.analysis.AnalysisAssignController
    @DeleteMapping("/assign")
    public Map<String,Object> unassign(@RequestBody AssignReq req) {
        if (req == null || req.cameraIds == null || req.cameraIds.isEmpty()) {
            return Map.of("error", "cameraIds required");
        }
        int updated = service.unassignCamerasFromServer(req.serverId, req.cameraIds);
        return Map.of("updated", updated);
    }


}
