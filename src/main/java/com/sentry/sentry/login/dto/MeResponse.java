// src/main/java/com/sentry/sentry/login/dto/MeResponse.java
package com.sentry.sentry.login.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class MeResponse {
    private Long id;
    private String username;
    private String nickname;
    private List<String> roles;
}
