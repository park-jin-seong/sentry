package com.sentry.sentry.security;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import com.sentry.sentry.entity.UserAuthorityRepository;
import com.sentry.sentry.entity.UserAuthority;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserinfoRepository userRepo;
    private final UserAuthorityRepository authRepo;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Userinfo u = userRepo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음: " + username));

        String roleName = authRepo.findByUsername(username)
                .map(UserAuthority::getAuthority)
                .orElse("OBSERVER"); // 권한 없으면 기본 OBSERVER

        List<SimpleGrantedAuthority> auths =
                List.of(new SimpleGrantedAuthority("ROLE_" + roleName));

        return CustomUserDetails.of(
                u.getId(),
                u.getUsername(),
                u.getUserpassword(),   // BCrypt 해시
                auths
        );
    }
}
