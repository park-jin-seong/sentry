package com.sentry.sentry.login.dto;

import lombok.Data;

@Data
public class AccountCreateRequest {
    private String username;
    private String userpassword; // ★ 백엔드 필드명 유지
    private String nickname;
}
