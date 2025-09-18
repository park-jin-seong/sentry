package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;

    @MessageMapping("/{roomId}")
    @SendTo("/room/{roomId}")
    public MessageDTO sendMessage(@Payload MessageDTO messageDTO) {
//        messageDTO.setCreatedAt(LocalDateTime.now());
//        chatService.saveMessage(messageDTO.getRoomId(), messageDTO.getSenderId(), messageDTO.getContent());
        messageDTO.setCreatedAt(LocalDateTime.now());
        Message savedMessage = chatService.saveMessage(messageDTO);
        MessageDTO returnMessageDTO = chatService.convertMessageDTO(savedMessage);
        returnMessageDTO.setOptimisticId(messageDTO.getOptimisticId());
        return returnMessageDTO;
    }

    @GetMapping("/room/{roomId}")
    public Slice<MessageDTO> getMessages(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long lastMessageId,
            @RequestParam(defaultValue = "20") int size
    ) {
        // 커서 기반 페이징을 위한 Pageable 객체 생성
        // page 파라미터가 필요 없으므로 ofSize()를 사용합니다.
        PageRequest pageable = PageRequest.ofSize(size);

        return chatService.getMessagesByRoomId(roomId, lastMessageId, pageable);
    }
}
