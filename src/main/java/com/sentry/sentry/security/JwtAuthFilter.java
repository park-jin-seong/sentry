// src/main/java/com/sentry/sentry/security/JwtAuthFilter.java
package com.sentry.sentry.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Slf4j
@Component
public class JwtAuthFilter extends OncePerRequestFilter {
    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;

    public JwtAuthFilter(JwtUtil jwtUtil, UserDetailsService uds) {
        this.jwtUtil = jwtUtil; this.userDetailsService = uds;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res, FilterChain chain)
            throws ServletException, IOException {

        // 이미 인증됨 → 패스
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            chain.doFilter(req, res);
            return;
        }

        // 공개 경로/프리플라이트 → 패스
        String path = req.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || path.startsWith("/api/auth/")) {
            chain.doFilter(req, res);
            return;
        }

        String header = req.getHeader("Authorization");
        String token = (StringUtils.hasText(header) && header.startsWith("Bearer ")) ? header.substring(7) : null;

        if (token != null) {
            log.debug("[JwtAuthFilter] Authorization 헤더 감지, 일부 토큰 로그: {}", token.substring(0, Math.min(12, token.length())));
            if (!jwtUtil.validate(token) || jwtUtil.isExpired(token)) {
                log.warn("[JwtAuthFilter] 토큰 유효성/만료 실패 → 401로 이어질 수 있음");
                // 여기선 체인 계속 → 나중에 401 처리 (EntryPoint)
                chain.doFilter(req, res);
                return;
            }

            String username = jwtUtil.getUsername(token);
            log.debug("[JwtAuthFilter] 토큰 유효, username={}", username);

            UserDetails user = userDetailsService.loadUserByUsername(username);

            var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
            auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
            SecurityContextHolder.getContext().setAuthentication(auth);
        } else {
            log.trace("[JwtAuthFilter] Authorization 헤더 없음");
        }

        chain.doFilter(req, res);
    }
}
