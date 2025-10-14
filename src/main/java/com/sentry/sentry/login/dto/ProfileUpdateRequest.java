// src/main/java/com/sentry/sentry/login/dto/ProfileUpdateRequest.java
package com.sentry.sentry.login.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ProfileUpdateRequest {
    private String nickname;
    private String userpassword;
}
