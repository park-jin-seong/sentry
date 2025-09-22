package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import com.sentry.sentry.entity.Room;
import com.sentry.sentry.entity.Userinfo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public Message saveMessage(MessageDTO messageDTO) {
        Room room = roomRepository.getReferenceById(messageDTO.getRoomId());
        Userinfo sender = userRepository.getReferenceById(messageDTO.getSenderId());

        Message newMessage = new Message();
        newMessage.setRoom(room);
        newMessage.setSender(sender);
        newMessage.setContent(messageDTO.getContent());

        return chatRepository.save(newMessage);
    }

    public Slice<MessageDTO> getMessagesByRoomId(Long roomId, Long lastMessageId, Pageable pageable) {
        Slice<Message> messages;
        if (lastMessageId == null) {
            messages = chatRepository.findByRoomIdOrderByMessageIdDesc(roomId, pageable);
        } else {
            messages = chatRepository.findByRoomIdAndMessageIdLessThanOrderByMessageIdDesc(roomId, lastMessageId, pageable);
        }
        return messages.map(this::convertMessageDTO);
    }

//    public MessageDTO convertMessageDTO(Message message) {
//        MessageDTO messageDTO = new MessageDTO(message.getMessageId(),
//                message.getRoom().getRoomId(), message.getSender().getId(), message.getSender().getNickname(),
//                message.getContent(), message.getCreatedAt());
//
//        return messageDTO;
//    }

    // 새로 작성 -> chatRepository 에 추가
    public MessageDTO convertMessageDTO(Message message) {
        return chatRepository.findDtoById(message.getMessageId());
    }
}
