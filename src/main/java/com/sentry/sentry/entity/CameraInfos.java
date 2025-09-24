package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "camerainfos", catalog = "sentry_server")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CameraInfos {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long cameraId;

    @Column(name = "cameraName", nullable = false, length = 45)
    private String cameraName;

    @Column(name = "cctvUrl", nullable = false, length = 1024)
    private String cctvUrl;

    @Column(name = "coordx", nullable = false)
    private float coordx;

    @Column(name = "coordy", nullable = false)
    private float coordy;

    @Column(name = "isAnalisis", nullable = false, columnDefinition = "TINYINT(1)")
    private boolean isAnalisis;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "analysisServerId", foreignKey = @ForeignKey(name = "fk_analysisServerId"))
    private ServerInfo analysisServer;
}