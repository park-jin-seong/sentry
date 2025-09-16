package com.sentry.sentry.login;

import com.sentry.sentry.security.JwtUtil;
import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtUtil jwtUtil;
    private final UserinfoRepository repo;
    private final PasswordEncoder encoder;

    public AuthController(AuthenticationManager am, JwtUtil ju, UserinfoRepository r, PasswordEncoder e) {
        this.authManager = am; this.jwtUtil = ju; this.repo = r; this.encoder = e;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> req) {
        Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.get("username"), req.get("userpassword"))
        );
        User principal = (User) auth.getPrincipal();
        String token = jwtUtil.generateToken(principal.getUsername(), Map.of("role", "master"));
        return ResponseEntity.ok(Map.of("accessToken", token));
    }



}
