package com.sentry.sentry.chat;

import com.sentry.sentry.entity.RoomUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomUserRepository extends JpaRepository<RoomUser, Long> {
    boolean existsByUser_IdAndRoom_RoomId(Long userId, Long roomId);
}
