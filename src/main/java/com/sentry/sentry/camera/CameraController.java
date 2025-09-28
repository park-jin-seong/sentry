// src/main/java/com/sentry/sentry/camera/CameraController.java
package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CamService;
import com.sentry.sentry.cam.CameraInfosDTO;
import java.util.Map;
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
    private final CamService camService;
    private final com.sentry.sentry.entity.UserinfoRepository userinfoRepository;

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

    @PostMapping("/assign")
    public ResponseEntity<?> assignOne(
            @RequestParam Long userId,
            @RequestParam Long cameraId
    ) {
        service.assignCamera(userId, cameraId); // ✅ CameraService 호출
        return ResponseEntity.ok().build();
    }

    @PostMapping("/assign/batch")
    public ResponseEntity<?> assignBatch(@RequestBody AssignBatchReq req) {
        if (req == null || req.userId() == null || req.cameraIds() == null || req.cameraIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId/cameraIds required"));
        }
        req.cameraIds().forEach(cid -> service.assignCamera(req.userId(), cid));
        return ResponseEntity.ok(Map.of("assigned", req.cameraIds().size()));
    }

    /** username 기반 단건 할당 (프론트에서 user.id가 없을 때 폴백용) */
    @PostMapping("/assign/by-username")
    public ResponseEntity<?> assignByUsername(
            @RequestParam String username,
            @RequestParam Long cameraId
    ) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        }
        service.assignCamera(userOpt.get().getId(), cameraId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/assign/by-username")
    public ResponseEntity<?> assignByUsernameGet(
            @RequestParam String username,
            @RequestParam Long cameraId
    ) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        }
        service.assignCamera(userOpt.get().getId(), cameraId);
        return ResponseEntity.ok(Map.of("result","ok(get)"));
    }

    // src/main/java/com/sentry/sentry/camera/CameraController.java

    @GetMapping("/assigned/ids")
    public List<Long> assignedIds(@RequestParam Long userId) {
        return service.listAssignedIds(userId);
    }

    @GetMapping("/assigned/ids/by-username")
    public ResponseEntity<?> assignedIdsByUsername(@RequestParam String username) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        }
        Long uid = userOpt.get().getId();
        return ResponseEntity.ok(service.listAssignedIds(uid)); // ← [28,30,...] 형태
    }

    /** 배치 요청 DTO (레코드) */
    public record AssignBatchReq(Long userId, java.util.List<Long> cameraIds) {}

}
