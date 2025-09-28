package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

// com.sentry.sentry.entity.CameraAssign
@Entity
@Table(name = "cameraassign", schema = "sentry_client")
@Getter @Setter
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class CameraAssign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId", nullable = false)
    private Long userId;

    @Column(name = "assignedcameraId", nullable = false)
    private Long assignedCameraId;


}


