package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(
        name = "cameraassign",
        catalog = "sentry_client",
        uniqueConstraints = @UniqueConstraint(
                columnNames = {"userId", "assignedcameraId"},
                name = "uq_user_camera"
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CameraAssign {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId", nullable = false)
    private Long userId;

    // ★ DB에 있는 컬럼명 그대로
    @Column(name = "assignedcameraId", nullable = false)
    private Long assignedCameraId;
}
