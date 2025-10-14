package com.sentry.sentry.login.dto;

import lombok.Data;

@Data
public class AccountCreateRequest {
    private String username;
    private String userpassword;
    private String nickname;
}
