package com.sentry.sentry.login;

import com.sentry.sentry.entity.UserUiPref;
import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UiPrefService {

    private final UserUiPrefRepository prefRepo;
    private final UserinfoRepository userRepo;

    private static int clamp(int v, int min, int max) {
        return Math.min(max, Math.max(min, v));
    }

    @Transactional(readOnly = true)
    public UserUiPref getOrCreate(Long userId) {
        return prefRepo.findById(userId).orElseGet(() -> {
            Userinfo u = userRepo.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + userId));
            UserUiPref p = new UserUiPref();
            p.setUser(u);
            p.setUserId(u.getId());
            // 기본값
            p.setChatOpacity(70);
            p.setChatWidthPct(70);
            return prefRepo.save(p);
        });
    }

    @Transactional
    public UserUiPref update(Long userId, Integer opacity, Integer widthPct) {
        UserUiPref p = getOrCreate(userId);
        if (opacity != null)   p.setChatOpacity(clamp(opacity, 0, 100));
        if (widthPct != null)  p.setChatWidthPct(clamp(widthPct, 20, 100));
        return prefRepo.save(p);
    }
}
