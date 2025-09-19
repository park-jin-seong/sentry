package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Slice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;


@Repository
public interface ChatRepository extends JpaRepository<Message, Long> {

    @Query("SELECT m FROM Message m WHERE m.room.roomId = :roomId ORDER BY m.messageId DESC")
    Slice<Message> findByRoomIdOrderByMessageIdDesc(@Param("roomId") Long roomId, Pageable pageable);

    @Query("SELECT m FROM Message m WHERE m.room.roomId = :roomId AND m.messageId < :lastMessageId ORDER BY m.messageId DESC")
    Slice<Message> findByRoomIdAndMessageIdLessThanOrderByMessageIdDesc(@Param("roomId") Long roomId, @Param("lastMessageId") Long lastMessageId, Pageable pageable);
}
