package com.sentry.sentry.user;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

@Data
@NoArgsConstructor
@RequiredArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String userpassword;
    private String nickname;
}
