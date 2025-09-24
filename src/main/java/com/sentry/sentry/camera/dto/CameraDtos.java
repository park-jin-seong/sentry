package com.sentry.sentry.camera.dto;

import lombok.*;

public class CameraDtos {

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CreateReq {
        // 프런트 모달에서 넘어오는 필드
        private String name;    // cameraName
        private String cctvurl; // cctvUrl
        private float coordx;
        private float coordy;

        // 누구에게 할당할지 (프런트에서 me.id 넣어주거나 서버에서 가져오면 됨)
        private Long userId;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class Item {
        private Long id;        // cameraassign.id (행 삭제용)
        private Long cameraId;  // camerainfos.cameraId
        private String name;
        private String cctvurl;
        private float coordx;
        private float coordy;
    }
}
