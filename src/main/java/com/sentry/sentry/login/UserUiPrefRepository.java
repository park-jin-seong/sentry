package com.sentry.sentry.login;

import com.sentry.sentry.entity.UserUiPref;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserUiPrefRepository extends JpaRepository<UserUiPref, Long> {
}
