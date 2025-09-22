// src/main/java/com/sentry/sentry/login/MeController.java
package com.sentry.sentry.login;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.login.dto.MeResponse;
import com.sentry.sentry.login.dto.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.stream.Collectors;
import java.util.Map;

@Slf4j
@RequiredArgsConstructor
@RestController
@RequestMapping("/api")
public class MeController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<?> me(@AuthenticationPrincipal UserDetails user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "UNAUTHORIZED"));
        }

        // 닉네임 조회
        Userinfo info = authService.getUserinfo(user.getUsername());

        return ResponseEntity.ok(Map.of(
                "id", info.getId(),
                "username", user.getUsername(),
                "nickname", info.getNickname(),
                "roles", user.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList()
        ));
    }
    @PatchMapping("/me/profile")
    public ResponseEntity<?> updateProfile(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody ProfileUpdateRequest req
    ) {
        if (user == null) return ResponseEntity.status(401).build();

        try {
            Userinfo updated = authService.updateProfile(user.getUsername(), req);
            var roles = user.getAuthorities().stream()
                    .map(a -> a.getAuthority()).collect(Collectors.toList());

            // 비번 변경 여부에 따라 재로그인 유도 플래그(선택)
            boolean reLogin = req.getPassword() != null && !req.getPassword().isBlank();

            return ResponseEntity.ok(new Object() {
                public final MeResponse me = new MeResponse(
                        updated.getId(), updated.getUsername(), updated.getNickname(), roles
                );
                public final boolean requireReLogin = reLogin;
            });
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new Object(){ public final String error = e.getMessage(); });
        }
    }




    @GetMapping("/test")
    public String test(@AuthenticationPrincipal(expression="username") String username) {
        return username;
    }
}
