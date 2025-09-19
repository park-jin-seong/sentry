// src/main/java/com/sentry/sentry/config/SecurityConfig.java
package com.sentry.sentry.config;

import com.sentry.sentry.security.JwtAuthFilter;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.security.servlet.PathRequest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true, jsr250Enabled = true)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    // 세션 기반 인증 대신 JWT 기반 인증을 쓰기 위한 SecurityConfig

    // DaoAuthenticationProvider 등록
    // → UsernamePasswordAuthenticationToken 인증 시 UserDetailsService + PasswordEncoder 사용
    @Bean
    public DaoAuthenticationProvider daoAuthProvider(UserDetailsService uds, PasswordEncoder pe) {
        DaoAuthenticationProvider p = new DaoAuthenticationProvider();
        p.setUserDetailsService(uds);
        p.setPasswordEncoder(pe);
        return p;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http, DaoAuthenticationProvider provider) throws Exception {
        http
                // CSRF 비활성화 (JWT 사용)
                .csrf(csrf -> csrf.disable())

                // CORS 설정
                .cors(cors -> cors.configurationSource(req -> {
                    var c = new CorsConfiguration();
                    c.setAllowedOriginPatterns(List.of("http://localhost:*", "http://127.0.0.1:*"));
                    c.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"));
                    c.setAllowedHeaders(List.of("*"));
                    c.setAllowCredentials(true);
                    return c;
                }))

                // 세션 사용 안 함 (Stateless)
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                // 인증/인가 예외 처리 (JSON 응답)
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\":\"UNAUTHORIZED\"}");
                        })
                        .accessDeniedHandler((req, res, e) -> {
                            res.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            res.setContentType("application/json;charset=UTF-8");
                            res.getWriter().write("{\"error\":\"FORBIDDEN\"}");
                        })
                )

                // 접근 제어
                .authorizeHttpRequests(auth -> auth
                        // 정적 리소스 전체 허용 (css/js/images/webjars 등)
                        .requestMatchers(PathRequest.toStaticResources().atCommonLocations()).permitAll()
                        // 사전 요청 허용
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 에러/루트/파비콘 및 템플릿 진입점 허용
                        .requestMatchers("/", "/index", "/error", "/favicon.ico").permitAll()
                           // 개발용 테스트 페이지 및 모든 html 허용
                           .requestMatchers("/test", "/test.html").permitAll()
//                           .requestMatchers(HttpMethod.GET, "/**/*.html").permitAll()
                        // 인증 없이 접근 가능한 인증 관련 API
                        .requestMatchers("/api/auth/login", "/api/auth/refresh", "/api/auth/logout").permitAll()
                        // 그 외 모든 요청은 인증 필요
                        .requestMatchers("/api/auth/**").permitAll()              // 로그인/회원가입
                        .requestMatchers("/chat/**").permitAll()    // 나중에 지우기(테스트용)
                        .requestMatchers("/room/**").permitAll()    // 나중에 지우기(테스트용)
                        .anyRequest().authenticated()
                )

                // 기본 폼/베이직 인증 비활성화
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable())
                // 기본 /logout 필터 비활성화(커스텀 엔드포인트 사용 시 깔끔)
                .logout(logout -> logout.disable());

        // 커스텀 Provider 적용
        http.authenticationProvider(provider);

        // JWT 필터 등록 (UsernamePasswordAuthenticationFilter 앞)
        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // 비밀번호 인코더
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    // AuthenticationManager Bean 등록
    // → 인증 처리 시 AuthenticationProvider 사용
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
