package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @MessageMapping("/{roomId}")
    @SendTo("/room/{roomId}")
    public MessageDTO sendMessage(@Payload MessageDTO messageDTO) {
        chatService.saveMessage(messageDTO.getRoomId(), messageDTO.getSenderId(), messageDTO.getContent());
        return messageDTO;
    }

}
