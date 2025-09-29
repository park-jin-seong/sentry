// src/main/java/com/sentry/sentry/camera/CameraController.java
package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraInfosDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService service;

    // 목록
    @GetMapping("/assigned")
    public List<CameraInfosDTO> assigned(@RequestParam Long userId) {
        return service.listAssigned(userId).stream()
                .map(CameraInfosDTO::new)
                .toList();
    }

    // 추가/할당 (ITS 검색 결과를 그대로 보냄)
    @PostMapping("/assign")
    public ResponseEntity<CameraInfosDTO> assign(
            @RequestBody CameraService.AssignReq dto,
            @RequestParam Long userId
    ) {
        var info = service.saveAndAssign(dto, userId);
        return ResponseEntity.ok(new CameraInfosDTO(info));
    }

    // ✅ 삭제 = 항상 하드 삭제
    @DeleteMapping("/{cameraId}")
    public ResponseEntity<Void> delete(@PathVariable Long cameraId) {
        service.deleteCamera(cameraId);
        return ResponseEntity.noContent().build();
    }

    // (옵션) 수정
    @PatchMapping("/{cameraId}")
    public ResponseEntity<CameraInfosDTO> update(
            @PathVariable Long cameraId,
            @RequestBody CameraService.CameraUpdateReq req
    ) {
        var info = service.updateCamera(cameraId, req);
        return ResponseEntity.ok(new CameraInfosDTO(info));
    }
}
