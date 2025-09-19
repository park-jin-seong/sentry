// src/main/java/com/sentry/sentry/security/JwtUtil.java
package com.sentry.sentry.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

@Component
public class JwtUtil {
    private final Key key;
    private final long ACCESS_MS;
    private final long REFRESH_MS;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-ms:900000}") long accessMs,
            @Value("${jwt.refresh-ms:1209600000}") long refreshMs
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ACCESS_MS = accessMs;
        this.REFRESH_MS = refreshMs;
    }

    public String generateAccessToken(String username, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims).setSubject(username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ACCESS_MS))
                .claim("typ", "access")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public String generateRefreshToken(String username, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims).setSubject(username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + REFRESH_MS))
                .claim("typ", "refresh")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public boolean isExpired(String token) {
        try {
            Date exp = parseClaims(token).getExpiration();
            return exp.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    public Claims parseClaims(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build()
                .parseClaimsJws(token).getBody();
    }

    public boolean isRefreshToken(String token) {
        try {
            Object typ = parseClaims(token).get("typ");
            return "refresh".equals(typ);
        } catch (JwtException e) {
            return false;
        }
    }
}
