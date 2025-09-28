// src/main/java/com/sentry/sentry/entity/CameraInfos.java
package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "camerainfos", catalog = "sentry_server")
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraInfos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "cameraId")
    private Long cameraId;

    @Column(name = "cameraName", nullable = false, length = 200)
    private String cameraName;

    @Column(name = "cctvUrl", nullable = false, unique = true, length = 1000)
    private String cctvUrl;

    @Column(name = "coordx", nullable = false)
    private double coordx;

    @Column(name = "coordy", nullable = false)
    private double coordy;

    @Column(name = "isAnalisis", nullable = false)
    private boolean isAnalisis;

    @Column(name = "owner_user_id", nullable = false)
    private Long ownerUserId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysisServerId")
    private ServerInfo analysisServer;
}
