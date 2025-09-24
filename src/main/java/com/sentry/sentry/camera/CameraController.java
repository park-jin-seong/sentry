package com.sentry.sentry.camera;

import com.sentry.sentry.camera.dto.CameraDtos;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cameras")
public class CameraController {

    private final CameraService cameraService;

    // (프런트: GET /api/cameras?userId=123)
    @GetMapping
    public ResponseEntity<List<CameraDtos.Item>> list(@RequestParam Long userId) {
        return ResponseEntity.ok(cameraService.listByUser(userId));
    }

    // (프런트: POST /api/cameras  body: {name,cctvurl,coordx,coordy,userId})
    @PostMapping
    public ResponseEntity<CameraDtos.Item> create(@RequestBody CameraDtos.CreateReq req) {
        return ResponseEntity.ok(cameraService.createAndAssign(req));
    }

    // (프런트: DELETE /api/cameras/{assignId}?userId=123)
    @DeleteMapping("/{assignId}")
    public ResponseEntity<Void> delete(@PathVariable Long assignId, @RequestParam Long userId) {
        cameraService.deleteAssign(assignId, userId);
        return ResponseEntity.noContent().build();
    }
}
