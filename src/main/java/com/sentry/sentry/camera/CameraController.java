// src/main/java/com/sentry/sentry/camera/CameraController.java
package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CameraInfosDTO;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService service;

    /** 사용자 할당 목록 */
    @GetMapping("/assigned")
    public List<CameraInfosDTO> assigned(@RequestParam Long userId) {
        return service.listAssigned(userId).stream()
                .map(c -> new CameraInfosDTO(c, userId))
                .toList();
    }

    /** (선택) ITS 검색에서 추가/할당 */
    // @PostMapping("/assign")
    // public ResponseEntity<CameraInfosDTO> assign(
    //         @RequestBody CameraService.AssignReq dto,
    //         @RequestParam Long userId
    // ) {
    //     var info = service.saveAndAssign(dto, userId);
    //     return ResponseEntity.ok(new CameraInfosDTO(info, userId));
    // }

    /** 오너만 수정 가능 */
    @PatchMapping("/{cameraId}")
    public ResponseEntity<CameraInfosDTO> update(
            @PathVariable Long cameraId,
            @RequestParam Long userId,
            @RequestBody CameraService.CameraUpdateReq req
    ) {
        var info = service.updateCameraOwned(cameraId, userId, req);
        return ResponseEntity.ok(new CameraInfosDTO(info, userId));
    }

    /** 오너면 하드삭제, 비오너면 내 매핑만 해제 */
    @DeleteMapping("/{cameraId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long cameraId,
            @RequestParam Long userId
    ) {
        service.deleteOrUnassign(cameraId, userId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/add")
    public ResponseEntity<CameraInfosDTO> add(
            @RequestBody CameraInfosDTO dto,
            @AuthenticationPrincipal CustomUserDetails user // 토큰에서 유저 ID
    ) {
        Long creatorId = user.getId(); // 로그인 사용자 ID
        CameraInfos saved = service.addCamera(dto, creatorId);
        return ResponseEntity.ok(new CameraInfosDTO(saved, creatorId));
    }

}
