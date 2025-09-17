package com.sentry.sentry.chat;

import com.sentry.sentry.Userinfo;
import com.sentry.sentry.chat.Message;
import com.sentry.sentry.chat.Room;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

/**
 * 방 참여자 정보 및 마지막 읽은 메시지 ID를 저장하는 엔티티
 * DB의 'room_user' 테이블과 매핑됩니다.
 */
@Entity
@Table(name = "room_user")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RoomUser {

    /**
     * 기본키
     * DB의 'id'와 매핑되며, 자동 증가합니다.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Userinfo 엔티티와의 다대일(Many-to-One) 관계
     * DB의 'user_id' 외래키와 매핑됩니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private Userinfo user;

    /**
     * Room 엔티티와의 다대일(Many-to-One) 관계
     * DB의 'room_id' 외래키와 매핑됩니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    /**
     * Message 엔티티와의 다대일(Many-to-One) 관계
     * 사용자가 마지막으로 읽은 메시지를 나타냅니다.
     * DB의 'last_read_message_id' 외래키와 매핑됩니다.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "last_read_message_id")
    private Message lastReadMessage;

}