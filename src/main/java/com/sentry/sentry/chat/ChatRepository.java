package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface ChatRepository extends JpaRepository<Message, Long> {



}
