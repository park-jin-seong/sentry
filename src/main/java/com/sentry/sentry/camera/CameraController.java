package com.sentry.sentry.camera;

import com.sentry.sentry.cam.CamService;
import com.sentry.sentry.cam.CameraInfosDTO;
import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.entity.UserinfoRepository;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/camera")
@RequiredArgsConstructor
public class CameraController {

    private final CameraService service;
    private final CamService camService;
    private final UserinfoRepository userinfoRepository;

    /** 사용자 할당 목록 (DTO) */
    @GetMapping("/assigned")
    public List<CameraInfosDTO> assigned(@RequestParam Long userId) {
        return service.listAssigned(userId).stream()
                .map(c -> new CameraInfosDTO(c, userId))
                .toList();
    }

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
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        Long creatorId = user.getId();
        CameraInfos saved = service.addCamera(dto, creatorId);
        return ResponseEntity.ok(new CameraInfosDTO(saved, creatorId));
    }

    /** 개별 할당 */
    @PostMapping("/assign")
    public ResponseEntity<?> assignOne(
            @RequestParam Long userId,
            @RequestParam Long cameraId
    ) {
        service.assignCamera(userId, cameraId);
        return ResponseEntity.ok().build();
    }

    /** 배치 할당 */
    @PostMapping("/assign/batch")
    public ResponseEntity<?> assignBatch(@RequestBody AssignBatchReq req) {
        if (req == null || req.userId() == null || req.cameraIds() == null || req.cameraIds().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "userId/cameraIds required"));
        }
        req.cameraIds().forEach(cid -> service.assignCamera(req.userId(), cid));
        return ResponseEntity.ok(Map.of("assigned", req.cameraIds().size()));
    }

    /** username 기반 단건 할당 (userId 없는 경우 폴백) */
    @PostMapping("/assign/by-username")
    public ResponseEntity<?> assignByUsername(
            @RequestParam String username,
            @RequestParam Long cameraId
    ) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        service.assignCamera(userOpt.get().getId(), cameraId);
        return ResponseEntity.ok().build();
    }

    /** (GET 테스트용) username 기반 단건 할당 */
    @GetMapping("/assign/by-username")
    public ResponseEntity<?> assignByUsernameGet(
            @RequestParam String username,
            @RequestParam Long cameraId
    ) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        service.assignCamera(userOpt.get().getId(), cameraId);
        return ResponseEntity.ok(Map.of("result","ok(get)"));
    }

    /** userId 기반: 이미 배정된 id 리스트 */
    @GetMapping("/assigned/ids")
    public List<Long> assignedIds(@RequestParam Long userId) {
        return service.listAssignedIds(userId);
    }

    /** username 기반: 이미 배정된 id 리스트 */
    @GetMapping("/assigned/ids/by-username")
    public ResponseEntity<?> assignedIdsByUsername(@RequestParam String username) {
        var userOpt = userinfoRepository.findByUsername(username);
        if (userOpt.isEmpty()) return ResponseEntity.badRequest().body(Map.of("error","user not found"));
        Long uid = userOpt.get().getId();
        return ResponseEntity.ok(service.listAssignedIds(uid));
    }

    /** ✅ username 기반 해제 (프론트 폴백용) */
    @DeleteMapping("/assign/by-username")
    public ResponseEntity<?> unassignByUsername(
            @RequestParam String username,
            @RequestParam Long cameraId
    ) {
        service.unassignByUsername(username, cameraId); // ✅ 서비스로 위임 (트랜잭션)
        return ResponseEntity.noContent().build();
    }

    /** 배치 요청 DTO */
    public record AssignBatchReq(Long userId, java.util.List<Long> cameraIds) {}
}
