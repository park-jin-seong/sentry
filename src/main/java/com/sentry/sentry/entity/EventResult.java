package com.sentry.sentry.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;

@Entity
@Table(name = "eventresult", catalog = "sentry_server")
public class EventResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "eventResultId", nullable = false)
    private Long eventResultId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cameraId", referencedColumnName = "cameraId", nullable = false)
    private CameraInfos cameraInfo;

    @CreationTimestamp
    @Column(name = "eventOccurTime", nullable = false, updatable = false, columnDefinition = "TIMESTAMP DEFAULT CURRENT_TIMESTAMP")
    private LocalDateTime eventOccurTime;

    @Column(name = "thumbnailPath", nullable = false, length = 1024)
    private String thumbnailPath;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "serverId", referencedColumnName = "serverId", nullable = false)
    private ServerInfo serverInfo;

    @Column(name = "classId", nullable = false)
    private Long classId;
}