package com.sentry.sentry.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.RequiredArgsConstructor;
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

    @Column(name = "username", length = 45, nullable = false, unique = true)
    private String username;

    @JsonIgnore
    @ToString.Exclude
    @Column(name = "userpassword", length = 255,nullable = false)
    private String userpassword;

    @Column(name = "nickname", length = 255, nullable = false, unique = true)
    private String nickname;

    @OneToMany(mappedBy = "user", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RoomUser> roomUsers;


}