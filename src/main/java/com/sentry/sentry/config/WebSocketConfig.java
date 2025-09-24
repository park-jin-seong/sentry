package com.sentry.sentry.config;

//import com.sentry.sentry.cam.RtspWebSocketHandler;
import com.sentry.sentry.cam.RtspWebSocketHandler;
import com.sentry.sentry.chat.StompAuthChannelInterceptor;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.*;

@Configuration
@EnableWebSocket
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer,WebSocketConfigurer {
    private final StompAuthChannelInterceptor stompAuthChannelInterceptor;
    private final RtspWebSocketHandler rtspWebSocketHandler;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.setApplicationDestinationPrefixes("/send");
        registry.enableSimpleBroker("/room");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/chat")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }
    // 추가
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(stompAuthChannelInterceptor);
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // 단일 엔드포인트, 채널은 쿼리 파라미터로 전달
        registry.addHandler(rtspWebSocketHandler, "/ws/rtsp")
                .setAllowedOrigins("*");
    }
//
//@Configuration
//@EnableWebSocket
//@EnableWebSocketMessageBroker
//@RequiredArgsConstructor
//public class WebSocketConfig implements WebSocketConfigurer, WebSocketMessageBrokerConfigurer {
//    private final RtspWebSocketHandler rtspWebSocketHandler;
//    @Override
//    public void configureMessageBroker(MessageBrokerRegistry registry) {
//        registry.setApplicationDestinationPrefixes("/send");
//        registry.enableSimpleBroker("/room");
//    }
//
//    @Override
//    public void registerStompEndpoints(StompEndpointRegistry registry) {
//        registry.addEndpoint("/chat")
//                .setAllowedOriginPatterns("*")
//                .withSockJS();
//    }
//    @Override
//    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
//        // 단일 엔드포인트, 채널은 쿼리 파라미터로 전달
//        registry.addHandler(rtspWebSocketHandler, "/ws/rtsp")
//                .setAllowedOrigins("*");
//    }

}