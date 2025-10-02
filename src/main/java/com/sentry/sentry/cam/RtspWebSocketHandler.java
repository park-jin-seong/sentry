package com.sentry.sentry.cam;


import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.socket.FrameSocketThreadClass;
import com.sentry.sentry.socket.ServerInfoService;
import com.sentry.sentry.socket.StreamInfoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.ArrayList;
import java.util.List;


@Component
@RequiredArgsConstructor
public class RtspWebSocketHandler extends TextWebSocketHandler {

    private final ServerInfoService serverInfoService;
    private final CamService camService;
    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {}

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        Long userId = Long.parseLong(message.getPayload());
        ServerInfo serverInfo = serverInfoService.getServerInfo("Middle");
        List<Long> camIdList = camService.getCam(userId);
        String serverIp = serverInfo.getServerIp();
        int serverPort = serverInfo.getServerPort();

        FrameSocketThreadClass frameSocketThreadClass = new FrameSocketThreadClass(serverIp, serverPort, userId, camIdList);
        new Thread(() -> {
            try {
                streamFrames(session, frameSocketThreadClass);
            } catch (Exception e) {
                throw new RuntimeException("망");
            }
        }).start();
    }

    private void streamFrames(WebSocketSession session, FrameSocketThreadClass frameThread) throws InterruptedException {
        frameThread.Start();
        try {
            while (session.isOpen()) {
                String frame = frameThread.getLatestFrameBase64();
                session.sendMessage(new TextMessage(frame));
                Thread.sleep(1);
            }
        } catch (Exception e) {
            e.printStackTrace();
        } finally {
            frameThread.Stop(); // 클라이언트 종료 시 grabber 종료
            System.out.println("Streaming thread 종료: " + session.getId());
        }
    }
    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) throws Exception {
        System.out.println("WebSocket closed: " + session.getId() + " 상태: " + status);
        // session 종료 시 관련 FrameSocketThreadClass 종료
    }

}