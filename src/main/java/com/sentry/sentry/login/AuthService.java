// src/main/java/com/sentry/sentry/login/AuthService.java
package com.sentry.sentry.login;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import com.sentry.sentry.login.dto.ProfileUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserinfoRepository userinfoRepository;
    private final PasswordEncoder passwordEncoder;

    public Userinfo getUserinfo(String username) {
        return userinfoRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음: " + username));
    }

    @Transactional
    public Userinfo updateProfile(String username, ProfileUpdateRequest req) {
        Userinfo u = getUserinfo(username);

        boolean changed = false;

        // 닉네임 변경
        if (req.getNickname() != null) {
            String nn = req.getNickname().trim();
            if (!nn.isEmpty() && !nn.equals(u.getNickname())) {
                // 본인 제외 중복 체크
                if (userinfoRepository.existsByNicknameAndIdNot(nn, u.getId())) {
                    throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
                }
                u.setNickname(nn);
                changed = true;
            }
        }

        // 비밀번호 변경 (엔티티 필드명: userpassword)
        if (req.getPassword() != null) {
            String pw = req.getPassword().trim();
            if (!pw.isEmpty()) {
                if (pw.length() < 8) {
                    throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
                }
                u.setUserpassword(passwordEncoder.encode(pw));
                changed = true;
            }
        }

        if (changed) {
            userinfoRepository.save(u);
        }
        return u;
    }
}
