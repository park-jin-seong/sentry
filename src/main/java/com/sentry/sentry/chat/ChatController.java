package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Slice;
import org.springframework.data.domain.Sort;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
public class ChatController {
    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

//    @MessageMapping("/{roomId}")
//    @SendTo("/room/{roomId}")
//    public MessageDTO sendMessage(@Payload MessageDTO messageDTO, @AuthenticationPrincipal CustomUserDetails customUserDetails, @PathVariable String roomId) {
//        if(customUserDetails.getId() == null){
//            System.out.println(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>사용자id null");
//        }
//        messageDTO.setSenderId(customUserDetails.getId());
//        messageDTO.setCreatedAt(LocalDateTime.now());
//        Message savedMessage = chatService.saveMessage(messageDTO);
//        MessageDTO returnMessageDTO = chatService.convertMessageDTO(savedMessage);
//        returnMessageDTO.setOptimisticId(messageDTO.getOptimisticId());
//        return returnMessageDTO;
//    }

    // 새로 작성
    @MessageMapping("/chat/{roomId}")   // 클라 전송: /send/chat/{roomId}
    public void sendMessage(@Payload MessageDTO messageDTO,
                            @DestinationVariable Long roomId,
                            Principal principal) {

        var auth = (Authentication) principal;
        var cud  = (CustomUserDetails) auth.getPrincipal();

        messageDTO.setSenderId(cud.getId());
        messageDTO.setRoomId(roomId);
        messageDTO.setCreatedAt(LocalDateTime.now());

        Message saved = chatService.saveMessage(messageDTO);
        MessageDTO out = chatService.convertMessageDTO(saved);

        out.setOptimisticId(messageDTO.getOptimisticId());

        messagingTemplate.convertAndSend("/room/" + roomId, out);
    }




    @GetMapping("/room/{roomId}")
    public Slice<MessageDTO> getMessages(
            @PathVariable Long roomId,
            @RequestParam(required = false) Long lastMessageId,
            @RequestParam(defaultValue = "20") int size
    ) {
        PageRequest pageable = PageRequest.ofSize(size);

        return chatService.getMessagesByRoomId(roomId, lastMessageId, pageable);
    }
}
