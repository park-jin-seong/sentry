package com.sentry.sentry.camera;

import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.its.dto.ItsCctvResponse;
import com.sentry.sentry.camera.CameraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService service;

    @PostMapping("/assign")
    public ResponseEntity<CameraAssign> assign(
            @RequestBody ItsCctvResponse.CctvItem dto,
            @RequestParam Long userId
    ) {
        return ResponseEntity.ok(service.saveAndAssign(dto, userId));
    }
}
