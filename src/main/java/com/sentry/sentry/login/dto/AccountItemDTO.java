package com.sentry.sentry.login.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountItemDTO {
    private String username;
    private String nickname;
    private String role;
}
