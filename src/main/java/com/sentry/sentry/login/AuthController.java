// src/main/java/com/sentry/sentry/login/AuthController.java
package com.sentry.sentry.login;

import com.sentry.sentry.security.JwtUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        final String userpassword = req.get("userpassword");
        log.info("[LOGIN] 요청 username='{}', pwd_len={}", username, userpassword == null ? null : userpassword.length());

        System.out.println("username:"+username);

        try {
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, userpassword)
            );
            log.info("[LOGIN] 인증 성공: name='{}', authorities={}", auth.getName(), auth.getAuthorities());

            // roles를 claims로 넣으면 매 요청 DB조회 없이 권한 복원 가능
            List<String> roles = List.of("ROLE_MASTER");
            String access  = jwt.generateAccessToken(auth.getName(), Map.of("roles", roles));
            String refresh = jwt.generateRefreshToken(auth.getName(), Map.of("roles", roles));

            // 리프레시 → HttpOnly 쿠키
            ResponseCookie refreshCookie = ResponseCookie.from("REFRESH_TOKEN", refresh)
                    .httpOnly(true).secure(false)     // HTTPS에선 true
                    .sameSite("Lax").path("/")
                    .maxAge(Duration.ofDays(14))
                    .build();

            log.info("[LOGIN] access_len={}, refresh_len={}", access.length(), refresh.length());

            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                    .body(Map.of("accessToken", access));

        } catch (BadCredentialsException e) {
            log.warn("[LOGIN-ERR] BadCredentials: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error","BAD_CREDENTIALS"));
        } catch (Exception e) {
            log.error("[LOGIN-ERR] 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error","SERVER_ERROR"));
        }
    }

    @PostMapping(value = "/refresh", produces = "application/json")
    public ResponseEntity<?> refresh(HttpServletRequest request) {
        String refresh = readCookie(request, "REFRESH_TOKEN");
        log.info("[REFRESH] 쿠키 refresh 존재? {}", refresh != null);

        if (refresh == null || !jwt.validate(refresh) || !jwt.isRefreshToken(refresh)) {
            log.warn("[REFRESH] 리프레시 없음/유효하지 않음");
            return ResponseEntity.status(401).body(Map.of("error","NO_OR_INVALID_REFRESH"));
        }

        String username = jwt.getUsername(refresh);
        log.info("[REFRESH] username={}", username);

        // (선택) 토큰 회전/블랙리스트 체크 로직 위치
        List<String> roles = List.of("ROLE_USER");
        String newAccess = jwt.generateAccessToken(username, Map.of("roles", roles));

        log.info("[REFRESH] newAccess_len={}", newAccess.length());
        return ResponseEntity.ok(Map.of("accessToken", newAccess));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout() {
        // REFRESH 쿠키 삭제
        ResponseCookie del = ResponseCookie.from("REFRESH_TOKEN", "")
                .httpOnly(true).secure(false).sameSite("Lax").path("/")
                .maxAge(0).build();
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, del.toString())
                .body(Map.of("result","ok"));
    }

    private String readCookie(HttpServletRequest req, String name) {
        Cookie[] cookies = req.getCookies();
        if (cookies == null) return null;
        for (Cookie c : cookies) if (name.equals(c.getName())) return c.getValue();
        return null;
    }





}
