package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "userauthority")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor @Builder
public class UserAuthority {

    @Id
    @Column(name = "userId", nullable = false)
    private long userId;

    @Column(name = "authority", length = 45, nullable = false)
    private String authority;
}
