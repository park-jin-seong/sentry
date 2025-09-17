package com.sentry.sentry.chat;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class MessageDTO {
    private Long messageId;
    private Long roomId;
    private Long senderId;
    private String content;
    private LocalDateTime createdAt;
}