package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_ui_pref")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserUiPref {

    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private Userinfo user;

    @Column(name = "chat_opacity", nullable = false)
    private Integer chatOpacity = 70;

    @Column(name = "chat_width_pct", nullable = false)
    private Integer chatWidthPct = 70;
}
