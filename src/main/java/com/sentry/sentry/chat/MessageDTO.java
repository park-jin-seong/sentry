package com.sentry.sentry.chat;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String senderNickname;
    private String content;
    private LocalDateTime createdAt;
    private Long optimisticId;


    public MessageDTO(Long messageId, Long roomId, Long senderId, String senderNickname, String content, LocalDateTime createdAt) {
        this.messageId = messageId;
        this.roomId = roomId;
        this.senderId = senderId;
        this.senderNickname = senderNickname;
        this.content = content;
        this.createdAt = createdAt;
    }


}
