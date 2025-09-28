package com.sentry.sentry.login.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class AccountItemDTO {
    private Long id;
    private String username;
    private String nickname;
    private String role;
}
