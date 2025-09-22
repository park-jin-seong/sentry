package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "userauthority")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserAuthority {

    @Id
    @Column(name = "userId", nullable = false)  // DB 컬럼명과 정확히 맞춤
    private long userId;

    @Column(name = "authority", length = 45, nullable = false)
    private String authority;  // 예: ADMIN / OWNER / MASTER / OBSERVER 등
}
