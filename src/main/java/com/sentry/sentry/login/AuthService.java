package com.sentry.sentry.login;

import com.sentry.sentry.entity.*;
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
    private final UserAuthorityRepository userAuthorityRepository;
    private final PasswordEncoder passwordEncoder;

    public Userinfo getUserinfo(String username) {
        return userinfoRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음: " + username));
    }

    @Transactional
    public Userinfo updateProfile(String username, ProfileUpdateRequest req) {
        Userinfo u = getUserinfo(username);
        boolean changed = false;

        if (req.getNickname() != null) {
            String nn = req.getNickname().trim();
            if (!nn.isEmpty() && !nn.equals(u.getNickname())) {
                if (userinfoRepository.existsByNicknameAndIdNot(nn, u.getId()))
                    throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
                u.setNickname(nn);
                changed = true;
            }
        }
        if (req.getUserpassword() != null) {
            String pw = req.getUserpassword().trim();
            if (!pw.isEmpty()) {
                if (pw.length() < 8) throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
                u.setUserpassword(passwordEncoder.encode(pw));
                changed = true;
            }
        }
        if (changed) userinfoRepository.save(u);
        return u;
    }

    // === 새 유저 생성 (MASTER->OWNER, OWNER->OBSERVER만) ===
    @Transactional
    public Userinfo createUserByRole(Long creatorId, String creatorRole,
                                     String newUsername, String rawPw, String nickname) {

        if (newUsername == null || newUsername.isBlank())
            throw new IllegalArgumentException("아이디를 입력하세요.");
        if (rawPw == null || rawPw.length() < 8)
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");
        if (userinfoRepository.existsByUsername(newUsername))
            throw new IllegalArgumentException("이미 존재하는 아이디입니다.");
        if (nickname != null && !nickname.isBlank()
                && userinfoRepository.existsByNickname(nickname))
            throw new IllegalArgumentException("이미 존재하는 닉네임입니다.");

        String newRole = switch (creatorRole) {
            case "MASTER" -> "OWNER";
            case "OWNER"  -> "OBSERVER";
            default       -> throw new IllegalArgumentException("계정을 생성할 권한이 없습니다.");
        };

        Userinfo nu = new Userinfo();
        nu.setUsername(newUsername.trim());
        nu.setUserpassword(passwordEncoder.encode(rawPw));
        nu.setNickname((nickname == null || nickname.isBlank()) ? newUsername : nickname.trim());
        Userinfo saved = userinfoRepository.save(nu);

        // 권한 저장/업데이트 (userauthority)
        userAuthorityRepository.save(new UserAuthority(saved.getId(), newRole));

        return saved;
    }
}
