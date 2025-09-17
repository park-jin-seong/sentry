package com.sentry.sentry.config;

import com.sentry.sentry.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import jakarta.servlet.http.HttpServletResponse;
import java.util.List;

@Configuration
@RequiredArgsConstructor
@EnableMethodSecurity(
        prePostEnabled = true,
        securedEnabled = true,
        jsr250Enabled = true
)
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> cors.configurationSource(req -> {
                    var c = new CorsConfiguration();
                    // 반드시 사용하는 프론트 포트 추가
//                    c.setAllowedOrigins(List.of(
//                            "http://localhost:5176",
//                            "http://localhost:5173",
//                            "http://localhost:3000"
//
//                    ));
                    // 포트가 바뀌어도 동작하도록(선택)
                    c.setAllowedOriginPatterns(List.of(
                            "http://localhost:*",
                            "http://127.0.0.1:*"
                    ));
                    c.setAllowedMethods(List.of("GET","POST","PUT","DELETE","PATCH","OPTIONS"));
                    c.setAllowedHeaders(List.of("*")); // Authorization 등 헤더 허용
                    c.setExposedHeaders(List.of("Authorization","accessToken","Content-Type")); // (선택) 클라이언트에서 읽을 헤더
                    c.setAllowCredentials(true);
                    return c;
                }))
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .exceptionHandling(ex -> ex.authenticationEntryPoint((req, res, e) ->
                        res.sendError(HttpServletResponse.SC_UNAUTHORIZED)))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()   // Preflight 허용
                        .requestMatchers("/api/auth/**").permitAll()              // 로그인/회원가입
                        .anyRequest().authenticated()
                )
                .formLogin(form -> form.disable())
                .httpBasic(basic -> basic.disable());

        http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() { return new BCryptPasswordEncoder(); }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}
