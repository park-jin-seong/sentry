package com.sentry.sentry;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "userinfo")
@Data
public class Userinfo {

    @Id
    @Column(name = "id")
    private Long id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @Column(name = "userpassword", nullable = false)
    private String userpassword;

    @Column(name = "nickname", nullable = false, unique = true)
    private String nickname;

}