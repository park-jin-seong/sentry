// src/main/java/com/sentry/sentry/entity/UserAuthority.java
package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "userauthority", schema = "sentry_client")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
@IdClass(UserAuthority.Pk.class)
public class UserAuthority {
    @Id
    @Column(name = "userId", nullable = false)
    private Long userId;

    @Id
    @Column(name = "authority", nullable = false, length = 45)
    private String authority;

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class Pk implements java.io.Serializable {
        private Long userId;
        private String authority;
    }
}
