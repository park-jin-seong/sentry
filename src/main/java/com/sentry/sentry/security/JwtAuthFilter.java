package com.sentry.sentry.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.*;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

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

        // 공개/프리플라이트 → 패스
        String path = req.getRequestURI();
        if ("OPTIONS".equalsIgnoreCase(req.getMethod()) || path.startsWith("/api/auth/")) {
            chain.doFilter(req, res);
            return;
        }

        String header = req.getHeader("Authorization");
        String token = (StringUtils.hasText(header) && header.startsWith("Bearer ")) ? header.substring(7) : null;

        try {
            if (token != null) {
                if (!jwtUtil.validate(token)) {
                    unauthorized(res, "INVALID_OR_EXPIRED_TOKEN");
                    return;
                }
                String username = jwtUtil.getUsername(token);
                UserDetails user = userDetailsService.loadUserByUsername(username);

                var auth = new UsernamePasswordAuthenticationToken(user, null, user.getAuthorities());
                auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(req));
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
            chain.doFilter(req, res);
        } catch (Exception ex) {
            unauthorized(res, "AUTH_FILTER_ERROR");
        }
    }

    private void unauthorized(HttpServletResponse res, String code) throws IOException {
        res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        res.setContentType("application/json;charset=UTF-8");
        res.getWriter().write("{\"error\":\"" + code + "\"}");
    }
}
