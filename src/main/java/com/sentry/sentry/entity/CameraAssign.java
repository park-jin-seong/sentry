package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.*;

import java.io.Serializable;

@Entity
@Table(name = "cameraassign", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"userId", "assignedcameraId"}, name = "uq_user_camera")
})
@Builder
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CameraAssign implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "userId", nullable = false)
    private Long userId;

    @Column(name = "assignedcameraId", nullable = false)
    private Long assignedCameraId;

}