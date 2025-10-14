package com.sentry.sentry.chat;

import com.sentry.sentry.security.CustomUserDetailsService;
import com.sentry.sentry.security.JwtUtil; // 프로젝트에 있는 JWT 유틸 (이름/패키지 맞게 수정)
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

// STOMP(WebSocket) 연결 시(=CONNECT 프레임) 클라이언트가 보낸 JWT를 검증하고
// Authentication(Principal)을 웹소켓 세션에 넣어줌

@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService userDetailsSvc;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = StompHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
            String auth = accessor.getFirstNativeHeader("Authorization");
            if (auth != null && auth.startsWith("Bearer ")) {
                String token = auth.substring(7);
                String username = jwtUtil.getUsername(token);
                var userDetails = userDetailsSvc.loadUserByUsername(username);

                var authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());

                accessor.setUser(authentication);
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        }
        return message;
    }
}
