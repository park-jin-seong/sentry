package com.sentry.sentry.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.ToString;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "room")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Room {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "room_id")
    private Long roomId;

    @Column(name = "room_name", nullable = false)
    private String roomName;

    @Column(name = "last_message", columnDefinition = "TEXT")
    private String lastMessage;

    @Column(name = "last_message_sent_at")
    private LocalDateTime lastMessageSentAt;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<RoomUser> roomUsers;

    @OneToMany(mappedBy = "room", cascade = CascadeType.ALL)
    @ToString.Exclude
    private List<Message> messages;
}
