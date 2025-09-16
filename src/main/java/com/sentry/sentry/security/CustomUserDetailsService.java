package com.sentry.sentry.security;

import com.sentry.sentry.entity.Userinfo;
import com.sentry.sentry.entity.UserinfoRepository;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UserinfoRepository repo;

    public CustomUserDetailsService(UserinfoRepository repo) {
        this.repo = repo;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {

        Userinfo u = repo.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("사용자 없음: " + username));

        return User.builder()
                .username(u.getUsername())
                .password(u.getUserpassword())
                .roles("master")
                .build();
    }
}
