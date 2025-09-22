package com.sentry.sentry.login;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accounts")
public class AccountManageController {

    private final AuthService authService;

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('MASTER','OWNER')")
    public ResponseEntity<?> create(
            @AuthenticationPrincipal(expression = "id") Long creatorId,
            @AuthenticationPrincipal CustomUserDetails me,
            @RequestBody Map<String, String> body
    ) {
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String username = body.getOrDefault("username", "").trim();
        String userpassword = body.getOrDefault("userpassword", "").trim();
        String nickname = body.getOrDefault("nickname", "").trim();
        if (username.isEmpty() || userpassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "아이디는 필수, 비밀번호는 8자 이상"));
        }

        var auths = me.getAuthorities();
        boolean isMaster = auths.stream().anyMatch(a -> "ROLE_MASTER".equals(a.getAuthority()));
        boolean isOwner  = auths.stream().anyMatch(a -> "ROLE_OWNER".equals(a.getAuthority()));
        String myRole = isMaster ? "MASTER" : (isOwner ? "OWNER" : "OBSERVER");

        try {
            Userinfo created = authService.createUserByRole(
                    creatorId, myRole, username, userpassword, nickname
            );
            return ResponseEntity.ok(Map.of(
                    "id", created.getId(),
                    "username", created.getUsername(),
                    "nickname", created.getNickname()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(
                    e.getMessage().contains("권한") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST
            ).body(Map.of("error", e.getMessage()));
        }
    }
}
