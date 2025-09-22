// src/main/java/com/sentry/sentry/login/dto/ProfileUpdateRequest.java
package com.sentry.sentry.login.dto;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class ProfileUpdateRequest {
    private String nickname;   // 선택: null/빈문자 -> 무시
    private String userpassword;   // 선택: null/빈문자 -> 무시 (엔티티의 userpassword에 반영)
}
