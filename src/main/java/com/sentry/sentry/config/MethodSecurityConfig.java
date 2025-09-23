// 예: com.sentry.sentry.config.MethodSecurityConfig
package com.sentry.sentry.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;

@Configuration
@EnableMethodSecurity // @PreAuthorize 활성화
public class MethodSecurityConfig {}
