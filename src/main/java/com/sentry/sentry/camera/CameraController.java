package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraInfosDTO;
import com.sentry.sentry.entity.CameraAssign;
import com.sentry.sentry.its.dto.ItsCctvResponse;
import com.sentry.sentry.camera.CameraService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// com.sentry.sentry.camera.CameraController
@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService service;

    // ✅ 새로고침 시 프론트가 호출할 목록 API
    @GetMapping("/assigned")
    public List<CameraInfosDTO> assigned(@RequestParam Long userId) {
        return service.listAssigned(userId).stream()
                .map(com.sentry.sentry.cam.CameraInfosDTO::new)
                .toList();
    }

    // ✅ 할당 시에도 CameraInfosDTO 반환(프론트가 곧바로 렌더 가능)
    @PostMapping("/assign")
    public ResponseEntity<com.sentry.sentry.cam.CameraInfosDTO> assign(
            @RequestBody ItsCctvResponse.CctvItem dto,
            @RequestParam Long userId
    ) {
        var info = service.saveAndAssign(dto, userId);   // CameraInfos 반환하도록 변경(아래 2) 참고)
        return ResponseEntity.ok(new com.sentry.sentry.cam.CameraInfosDTO(info));
    }
}

