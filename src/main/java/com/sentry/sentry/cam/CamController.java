package com.sentry.sentry.cam;

import com.sentry.sentry.entity.CameraInfos;
import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import com.sentry.sentry.security.CustomUserDetails;
import com.sentry.sentry.socket.ServerInfoService;
import com.sentry.sentry.socket.SocketService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/cam")
public class CamController {
    private final CamService camService;
    private final SocketService socketService;
    private final ServerInfoService serverInfoService;
    private final UserinfoRepository userinfoRepository;

    @GetMapping("/{userId}")
    public String getCam(@PathVariable Long userId) {
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

//
//    @GetMapping("/list/{userId}")
//    public List<CameraInfosDTO> getAllCameraInfos(@PathVariable Long userId) {
//    }


    @GetMapping("/list-byUserId")
    public List<CameraInfosDTO> getAllCameraInfos(@RequestParam Long userId) {
        List<Long> camIdList = camService.getCam(userId);

        List<CameraInfos> allCameraInfos = camService.getCameraInfos(camIdList);
        List<CameraInfosDTO> allCameraInfosDTO = allCameraInfos.stream()
                .map(c -> new CameraInfosDTO(c, userId))
                .collect(Collectors.toList());

        System.out.println("allCameraInfosDTO = " + allCameraInfosDTO);
        return allCameraInfosDTO;
    }

    @PostMapping("/add")
    public CameraInfosDTO addCamera(@RequestBody CameraInfosDTO dto,
                                    @AuthenticationPrincipal CustomUserDetails user) {
        System.out.println(">>> /api/cam/add dto=" + dto);
        System.out.println(">>> user=" + (user != null ? user.getId() : "null"));

        if (user == null) {
            throw new IllegalStateException("로그인 사용자 정보 없음");
        }

        CameraInfos saved = camService.addCamera(dto, user.getId());
        System.out.println(">>> saved=" + saved);

        return new CameraInfosDTO(saved, user.getId());
    }


    @GetMapping("/all")
    public List<CameraInfosDTO> getAllCameras(@AuthenticationPrincipal CustomUserDetails user) {
        List<CameraInfos> all = camService.findAll();

        var ownerIds = all.stream()
                .map(CameraInfos::getOwnerUserId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        var users = userinfoRepository.findAllById(ownerIds);
        var nameById = users.stream().collect(Collectors.toMap(
                Userinfo::getId,
                u -> {
                    if (u.getNickname() != null) return u.getNickname();
                    if (u.getUsername() != null) return u.getUsername();
                    return "알 수 없음";
                }
        ));

        // 디버깅 출력
        System.out.println("ownerIds=" + ownerIds);
        System.out.println("users.size=" + users.size());
        users.forEach(u -> System.out.println(
                "user id=" + u.getId() +
                        ", name=" + u.getUsername() +
                        ", nick=" + u.getNickname()
        ));
        all.forEach(c -> System.out.println(
                "cam owner=" + c.getOwnerUserId() +
                        ", mapped=" + nameById.getOrDefault(c.getOwnerUserId(), "없음")
        ));

        Long currentUserId = (user != null ? user.getId() : null);

        return all.stream().map(c -> {
            CameraInfosDTO dto = new CameraInfosDTO(c, currentUserId);
            dto.setOwnerName(nameById.getOrDefault(c.getOwnerUserId(), "알 수 없음"));
            return dto;
        }).toList();
    }

    // CamController.java

    @PatchMapping("/{cameraId}")
    public ResponseEntity<?> updateCamera(
            @PathVariable Long cameraId,
            @RequestBody CameraInfosDTO dto,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        CameraInfos cam = camService.findById(cameraId)
                .orElseThrow(() -> new RuntimeException("카메라 없음"));

        if (!cam.getOwnerUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "본인 소유 아님"));
        }

        cam.setCameraName(dto.getCameraName());
        cam.setCoordx(dto.getCoordx());
        cam.setCoordy(dto.getCoordy());
        cam.setAnalisis(dto.getIsAnalisis());

        camService.save(cam);
        return ResponseEntity.ok(new CameraInfosDTO(cam, user.getId()));
    }

    @DeleteMapping("/{cameraId}")
    public ResponseEntity<?> deleteCamera(
            @PathVariable Long cameraId,
            @AuthenticationPrincipal CustomUserDetails user
    ) {
        CameraInfos cam = camService.findById(cameraId)
                .orElseThrow(() -> new RuntimeException("카메라 없음"));

        if (!cam.getOwnerUserId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "본인 소유 아님"));
        }

        camService.delete(cam);
        return ResponseEntity.ok(Map.of("result", "deleted"));
    }
    @GetMapping("/list-byName")
    public List<CameraInfosDTO> getCameraInfosByName(@RequestParam(required = false) String cameraName) {
        List<CameraInfos> allCameraInfos = camService.getCameraInfosByName(cameraName);
        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>" + cameraName);
        System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>" + allCameraInfos);
        List<CameraInfosDTO> allCameraInfosDTO = allCameraInfos.stream()
                .map(CameraInfosDTO::new)
                .collect(Collectors.toList());

        System.out.println("allCameraInfosDTO = " + allCameraInfosDTO);
        return allCameraInfosDTO;
    }


}
