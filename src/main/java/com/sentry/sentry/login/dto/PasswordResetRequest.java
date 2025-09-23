package com.sentry.sentry.login.dto;

import lombok.Data;

@Data
public class PasswordResetRequest {
    private String userpassword; // ★ 백엔드 필드명 유지
}
