package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import com.sentry.sentry.entity.Room;
import com.sentry.sentry.entity.Userinfo;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ChatService {
    private final ChatRepository chatRepository;
    private final RoomRepository roomRepository;
    private final UserRepository userRepository;

    @Transactional
    public Message saveMessage(Long roomId, Long senderId, String content) {
        Room room = roomRepository.getReferenceById(roomId);
        Userinfo sender = userRepository.getReferenceById(senderId);

        Message newMessage = new Message();
        newMessage.setRoom(room);
        newMessage.setSender(sender);
        newMessage.setContent(content);

        return chatRepository.save(newMessage);
    }
}
