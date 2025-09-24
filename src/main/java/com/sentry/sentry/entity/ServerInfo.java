package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Data
@Table(name = "serverinfos", catalog = "sentry_server")
public class ServerInfo {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "serverId")
    private Integer serverId;

    @Column(name = "serverIp", nullable = false)
    private String serverIp;

    @Column(name = "serverPort", nullable = false)
    private Integer serverPort;

    @Column(name = "serverType", nullable = false)
    private String serverType;

    @Column(name = "osId")
    private String osId;

    @Column(name = "osPw")
    private String osPw;
}