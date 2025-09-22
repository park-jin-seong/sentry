// src/main/java/com/sentry/sentry/login/AuthController.java
package com.sentry.sentry.login;

import com.sentry.sentry.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwt;

    public AuthController(AuthenticationManager am, JwtUtil jwt) {
        this.authManager = am; this.jwt = jwt;
    }

    @PostMapping(value = "/login", produces = "application/json")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        final String username = req.get("username");
        // ✅ 프론트/백 어느 쪽 키든 허용
        final String userpassword = req.getOrDefault("userpassword", req.get("userpassword"));

        log.info("[LOGIN] 요청 username='{}', pwd_len={}", username, userpassword == null ? null : userpassword.length());

        try {
            // ✅ 입력 검증
            if (username == null || username.isBlank() || userpassword == null || userpassword.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "username/userpassword required"));
            }

            // ✅ 스프링 시큐리티 인증
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, userpassword)
            );
            log.info("[LOGIN] 인증 성공: name='{}', authorities={}", auth.getName(), auth.getAuthorities());

            // ✅ 실제 권한 목록에서 roles 구성 (하드코딩 제거)
            List<String> roles = auth.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority) // e.g. ROLE_MASTER
                    .toList();

            String access  = jwt.generateAccessToken(auth.getName(), Map.of("roles", roles));
            String refresh = jwt.generateRefreshToken(auth.getName(), Map.of("roles", roles));

            // HttpOnly 리프레시 쿠키
            ResponseCookie refreshCookie = ResponseCookie.from("REFRESH_TOKEN", refresh)
                    .httpOnly(true).secure(false) // HTTPS면 true
                    .sameSite("Lax").path("/")
                    .maxAge(Duration.ofDays(14))
                    .build();

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(Map.of("accessToken", access));

        } catch (BadCredentialsException e) {
            log.warn("[LOGIN-ERR] BadCredentials: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","BAD_CREDENTIALS"));
        } catch (Exception e) {
            log.error("[LOGIN-ERR] 서버 오류", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error","SERVER_ERROR"));
        }
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refresh = readCookie(request, "REFRESH_TOKEN");
        log.info("[REFRESH] 쿠키 refresh 존재? {}", refresh != null);

        if (refresh == null || !jwt.validate(refresh) || !jwt.isRefreshToken(refresh)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error","NO_OR_INVALID_REFRESH"));
        }

        String username = jwt.getUsername(refresh);
        // 토큰에 roles 클레임을 넣었으니 그대로 사용(없으면 기본 ROLE_OBSERVER 등)
        List<String> roles = jwt.getRoles(refresh); // 없으면 jwt에 helper 추가하거나 기본값 사용
        if (roles == null || roles.isEmpty()) roles = List.of("ROLE_OBSERVER");

        String newAccess = jwt.generateAccessToken(username, Map.of("roles", roles));
        return ResponseEntity.ok(Map.of("accessToken", newAccess));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        ResponseCookie del = ResponseCookie.from("REFRESH_TOKEN", "")
                .httpOnly(true).secure(false).sameSite("Lax").path("/")
                .maxAge(0).build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, del.toString())
                .body(Map.of("result","ok"));
    }

    private String readCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) if (name.equals(c.getName())) return c.getValue();
        return null;
    }
}
