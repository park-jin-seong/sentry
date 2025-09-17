package com.sentry.sentry.chat;

import com.sentry.sentry.entity.Message;
import com.sentry.sentry.entity.Userinfo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<Userinfo, Long> {



}
