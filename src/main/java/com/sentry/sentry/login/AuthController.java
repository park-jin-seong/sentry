package com.sentry.sentry.login;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.security.JwtUtil;
import com.sentry.sentry.entity.UserinfoRepository;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.scope.ScopedProxyUtils;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserinfoRepository repo;
    private final AuthService authService;

    public AuthController(AuthenticationManager am, JwtUtil ju, UserinfoRepository r, AuthService authService) {
        this.authManager = am; this.jwtUtil = ju; this.repo = r; this.authService = authService;
    }

    @PostMapping(value = "/login", produces = "application/json")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req, HttpSession session) {
        final String username = req.get("username");
        final String userpassword = req.get("userpassword");

        log.info("[LOGIN-1] 요청 수신 username='{}' pwd_len={}",
                username, userpassword == null ? null : userpassword.length());

        try {
            log.info("[LOGIN-2] AuthenticationManager.authenticate 시작");
            Authentication auth = authManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, userpassword)
            );
            log.info("[LOGIN-3] 인증 성공 name='{}', principalType='{}', authorities={}",
                    auth.getName(),
                    auth.getPrincipal() == null ? null : auth.getPrincipal().getClass().getName(),
                    auth.getAuthorities());

            String subject = auth.getName(); // 안전하게 이름 사용 (캐스팅 X)
            String token = jwtUtil.generateToken(subject, Map.of("role", "master"));
            log.info("[LOGIN-4] 토큰 생성 성공 subject='{}' token_len={}", subject, token.length());



            Userinfo u = authService.getUserinfo(username);
            session.setAttribute("loginUser", u);


            // 프론트와 키 이름을 'accessToken'으로 확정
            return ResponseEntity.ok(Map.of("accessToken", token));

        } catch (BadCredentialsException e) {
            log.warn("[LOGIN-ERR] BadCredentialsException: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "BAD_CREDENTIALS"));
        } catch (DisabledException e) {
            log.warn("[LOGIN-ERR] DisabledException: {}", e.getMessage());
            return ResponseEntity.status(403).body(Map.of("error", "USER_DISABLED"));
        } catch (LockedException e) {
            log.warn("[LOGIN-ERR] LockedException: {}", e.getMessage());
            return ResponseEntity.status(423).body(Map.of("error", "USER_LOCKED"));
        } catch (AuthenticationException e) {
            log.warn("[LOGIN-ERR] AuthenticationException: {}", e.getMessage());
            return ResponseEntity.status(401).body(Map.of("error", "AUTH_FAILED"));
        } catch (Exception e) {
            log.error("[LOGIN-ERR] 서버 오류", e);
            return ResponseEntity.internalServerError().body(Map.of("error", "SERVER_ERROR"));
        }
    }
}
