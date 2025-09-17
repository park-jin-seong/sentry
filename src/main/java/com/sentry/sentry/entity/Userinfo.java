package com.sentry.sentry.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.ToString;
import java.util.List;

@Entity
@Table(name = "userinfo")
@Data
public class Userinfo {

    @Id
    @Column(name = "id")
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "username", nullable = false, unique = true)
    private String username;

    @JsonIgnore
    @ToString.Exclude
    @Column(name = "userpassword", nullable = false)
    private String userpassword;

    @Column(name = "nickname", nullable = false, unique = true)
    private String nickname;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RoomUser> roomUsers;
}