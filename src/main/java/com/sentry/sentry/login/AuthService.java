package com.sentry.sentry.login;

import com.sentry.sentry.chat.ChatRepository;
import com.sentry.sentry.chat.RoomRepository;
import com.sentry.sentry.chat.RoomUserRepository;
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

    private final RoomRepository roomRepository;
    private final RoomUserRepository roomUserRepository;

    private final ChatRepository chatRepository;

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

        userAuthorityRepository.save(
                UserAuthority.builder()
                        .userId(saved.getId())
                        .authority(newRole)
                        .build()
        );

        Room defaultRoom = roomRepository.findById(1L)
                .orElseThrow(() -> new IllegalStateException("기본 방(id=1)이 없습니다."));

        if (!roomUserRepository.existsByUser_IdAndRoom_RoomId(saved.getId(), 1L)) {
            RoomUser ru = new RoomUser();
            ru.setUser(saved);
            ru.setRoom(defaultRoom);
            ru.setLastReadMessage(null);
            roomUserRepository.save(ru);
        }

        return saved;
    }

    @Transactional
    public void adminUpdatePasswordByUsername(String username, String rawPw) {
        if (rawPw == null || rawPw.length() < 8)
            throw new IllegalArgumentException("비밀번호는 8자 이상이어야 합니다.");

        Userinfo u = userinfoRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("사용자 없음: " + username));
        u.setUserpassword(passwordEncoder.encode(rawPw));
        userinfoRepository.save(u);
    }

    @Transactional
    public void deleteUserCompletely(Long userId) {
        roomUserRepository.deleteByUser_Id(userId);

        if (chatRepository.existsBySender_Id(userId)) {
            chatRepository.deleteBySender_Id(userId);
        }

        userAuthorityRepository.deleteByUserId(userId);

        userinfoRepository.deleteById(userId);
    }
}
