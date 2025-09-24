package com.sentry.sentry.chat;

import com.sentry.sentry.entity.RoomUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoomUserRepository extends JpaRepository<RoomUser, Long> {
    boolean existsByUser_IdAndRoom_RoomId(Long userId, Long roomId);

    // 유저 계정 삭제
    void deleteByUser_Id(Long userId);
}
