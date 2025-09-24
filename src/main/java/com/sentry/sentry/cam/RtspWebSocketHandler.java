package com.sentry.sentry.cam;


import com.sentry.sentry.entity.ServerInfo;
import com.sentry.sentry.socket.FrameSocketThreadClass;
import com.sentry.sentry.socket.ServerInfoService;
import com.sentry.sentry.socket.StreamInfoDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
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

    private void streamFrames(WebSocketSession session, FrameSocketThreadClass  frameSocketThreadClass){
        System.out.println(session.isOpen());
        frameSocketThreadClass.Start();
        while (session.isOpen()) {
            try {
                String base64Frame = frameSocketThreadClass.getLatestFrameBase64();
                session.sendMessage(new TextMessage(base64Frame));
                Thread.sleep(1); // TODO: grabber.getFrameRate() 반영 가능
            } catch (Exception e) {
                e.printStackTrace();
                break;
            }
        }
    }
}