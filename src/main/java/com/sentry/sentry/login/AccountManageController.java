package com.sentry.sentry.login;

import com.sentry.sentry.entity.UserAuthority;
import com.sentry.sentry.entity.UserAuthorityRepository;
import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/accounts")
public class AccountManageController {

    private final AuthService authService;
    private final UserinfoRepository userinfoRepository;
    private final UserAuthorityRepository userAuthorityRepository;

    private String effectiveRole(CustomUserDetails cud) {
        String r = cud.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority) // ROLE_MASTER ...
                .findFirst().orElse("");
        return r.replaceFirst("^ROLE_", ""); // MASTER ...
    }

    private String nextCreatableRole(String myRole) {
        return switch (myRole) {
            case "MASTER" -> "OWNER";
            case "OWNER"  -> "OBSERVER";
            default       -> null;
        };
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MASTER','OWNER')")
    public List<Map<String, Object>> list(
            @AuthenticationPrincipal CustomUserDetails me,
            @RequestParam(required = false) String role
    ) {
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String myRole = effectiveRole(me);
        String allowed = nextCreatableRole(myRole);
        if (allowed == null) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "조회 권한 없음");

        String targetRole = (role == null || role.isBlank()) ? allowed : role.trim();
        if (!allowed.equals(targetRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "허용되지 않은 역할 조회");
        }

        List<UserAuthority> auths = userAuthorityRepository.findAllByAuthority(targetRole);
        if (auths.isEmpty()) return List.of();

        List<Long> ids = auths.stream().map(UserAuthority::getUserId).toList();
        Map<Long, String> roleMap = auths.stream()
                .collect(Collectors.toMap(UserAuthority::getUserId, UserAuthority::getAuthority));

        return userinfoRepository.findAllById(ids).stream()
                .sorted(Comparator.comparing(Userinfo::getUsername))
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "username", u.getUsername(),
                        "nickname", u.getNickname(),
                        "role", roleMap.get(u.getId())  // OWNER | OBSERVER
                ))
                .toList();
    }

    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('MASTER','OWNER')")
    public ResponseEntity<?> create(
            @AuthenticationPrincipal(expression = "id") Long creatorId,
            @AuthenticationPrincipal CustomUserDetails me,
            @RequestBody Map<String, String> body
    ) {
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        String username = body.getOrDefault("username", "").trim();
        String userpassword = body.getOrDefault("userpassword", "").trim(); // ★ 필드명 userpassword 유지
        String nickname = body.getOrDefault("nickname", "").trim();

        if (username.isEmpty() || userpassword.length() < 8) {
            return ResponseEntity.badRequest().body(Map.of("error", "아이디는 필수, 비밀번호는 8자 이상"));
        }

        String myRole = effectiveRole(me);

        try {
            Userinfo created = authService.createUserByRole(
                    creatorId, myRole, username, userpassword, nickname
            );
            String newRole = nextCreatableRole(myRole);
            return ResponseEntity.ok(Map.of(
                    "id", created.getId(),
                    "username", created.getUsername(),
                    "nickname", created.getNickname(),
                    "role", newRole
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(
                    e.getMessage().contains("권한") ? HttpStatus.FORBIDDEN : HttpStatus.BAD_REQUEST
            ).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/{username}/userpassword")
    @PreAuthorize("hasAnyRole('MASTER','OWNER')")
    public Map<String, Object> resetPassword(
            @AuthenticationPrincipal CustomUserDetails me,
            @PathVariable String username,
            @RequestBody Map<String, String> body
    ) {
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        String pw = body.getOrDefault("userpassword", "");
        if (pw.length() < 8) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "비밀번호는 8자 이상");

        Userinfo target = userinfoRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        String myRole = effectiveRole(me);
        String allowed = nextCreatableRole(myRole);
        String targetRole = userAuthorityRepository.findByUserId(target.getId())
                .map(UserAuthority::getAuthority).orElse(null);
        if (allowed == null || !allowed.equals(targetRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "변경 권한 없음");
        }

        authService.adminUpdatePasswordByUsername(username, pw);
        return Map.of("ok", true);
    }

    @DeleteMapping("/{username}")
    @PreAuthorize("hasAnyRole('MASTER','OWNER')")
    public Map<String, Object> remove(
            @AuthenticationPrincipal CustomUserDetails me,
            @PathVariable String username
    ) {
        if (me == null) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);

        Userinfo target = userinfoRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자 없음"));

        String myRole = effectiveRole(me);
        String allowed = nextCreatableRole(myRole);
        String targetRole = userAuthorityRepository.findByUserId(target.getId())
                .map(UserAuthority::getAuthority).orElse(null);
        if (allowed == null || !allowed.equals(targetRole)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "삭제 권한 없음");
        }

        authService.deleteUserCompletely(target.getId());
        return Map.of("ok", true);
    }
}
