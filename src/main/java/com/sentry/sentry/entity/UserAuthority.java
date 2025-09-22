package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "userauthority")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserAuthority {

    // username을 PK로 사용하는 구조(보내주신 코드 유지)
    @Id
    @Column(name = "username", length = 45, nullable = false)
    private String username;

    @Column(name = "authority", length = 45, nullable = false)
    private String authority;  // 예: ADMIN / OWNER / MASTER / OBSERVER 등
}
