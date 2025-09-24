// src/main/java/com/sentry/sentry/security/JwtUtil.java
package com.sentry.sentry.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.List;
import java.util.Map;

@Component
public class JwtUtil {
    private final Key key;
    private final long ACCESS_MS;
    private final long REFRESH_MS;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.access-ms:86400000}") long accessMs, // 24시간          // 1시간
            @Value("${jwt.refresh-ms:1209600000}") long refreshMs     // 14일
    ) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.ACCESS_MS = accessMs;
        this.REFRESH_MS = refreshMs;
    }

    /** Access 토큰 생성 (roles 등 클레임 포함 가능) */
    public String generateAccessToken(String username, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + ACCESS_MS))
                .claim("typ", "access")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** Refresh 토큰 생성 */
    public String generateRefreshToken(String username, Map<String, Object> claims) {
        long now = System.currentTimeMillis();
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(username)
                .setIssuedAt(new Date(now))
                .setExpiration(new Date(now + REFRESH_MS))
                .claim("typ", "refresh")
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    /** 토큰 유효성 검증(서명/파싱) */
    public boolean validate(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    /** 만료 여부 */
    public boolean isExpired(String token) {
        try {
            Date exp = parseClaims(token).getExpiration();
            return exp.before(new Date());
        } catch (JwtException e) {
            return true;
        }
    }

    /** subject(username) */
    public String getUsername(String token) {
        return parseClaims(token).getSubject();
    }

    /** roles 클레임 추출 (없으면 빈 리스트) */
    @SuppressWarnings("unchecked")
    public List<String> getRoles(String token) {
        try {
            Object rolesObj = parseClaims(token).get("roles");
            if (rolesObj instanceof List<?> list) {
                return list.stream().map(Object::toString).toList();
            }
            return List.of();
        } catch (JwtException e) {
            return List.of();
        }
    }

    /** Claims 파싱 */
    public Claims parseClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    /** refresh 토큰인지 여부 (typ=refresh) */
    public boolean isRefreshToken(String token) {
        try {
            Object typ = parseClaims(token).get("typ");
            return "refresh".equals(typ);
        } catch (JwtException e) {
            return false;
        }
    }
}
