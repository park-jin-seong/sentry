// src/main/java/com/sentry/sentry/login/MeController.java
package com.sentry.sentry.login;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api")
public class MeController {

    @GetMapping("/me")
    public Map<String, Object> me(@AuthenticationPrincipal UserDetails user) {
        log.info("[/api/me] principal={}, roles={}",
                user == null ? null : user.getUsername(),
                user == null ? null : user.getAuthorities().stream().map(GrantedAuthority::getAuthority).toList());
        return Map.of(
                "username", user.getUsername(),
                "roles", user.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .toList()
        );
    }

    @GetMapping("/test")
    public String test(@AuthenticationPrincipal(expression="username") String username) {
        return username;
    }
}
