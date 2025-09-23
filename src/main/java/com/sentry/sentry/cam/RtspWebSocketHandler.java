//package com.sentry.sentry.cam;
//
//
//import lombok.RequiredArgsConstructor;
//import org.springframework.stereotype.Component;
//import org.springframework.web.socket.TextMessage;
//import org.springframework.web.socket.WebSocketSession;
//import org.springframework.web.socket.handler.TextWebSocketHandler;
//
//
//@Component
//@RequiredArgsConstructor
//public class RtspWebSocketHandler extends TextWebSocketHandler {
//    private final RtspService  rtspService;
//
//
//
//    @Override
//    public void handleTextMessage(WebSocketSession session, TextMessage message) {
//        String channel = getChannelFromUri(session);
//
//        if ("start".equals(message.getPayload())) {
//
//            new Thread(() -> streamFrames(session, 0)).start();
//        }
//    }
//
//    private String getChannelFromUri(WebSocketSession session) {
//        if (session.getUri() != null && session.getUri().getQuery() != null) {
//            for (String param : session.getUri().getQuery().split("&")) {
//                String[] kv = param.split("=");
//                if (kv.length == 2 && kv[0].equals("channel")) {
//                    return kv[1];
//                }
//            }
//        }
//        return "0";
//    }
//
//    private void streamFrames(WebSocketSession session, int channelIndex) {
//        while (session.isOpen()) {
//            try {
//                String base64Frame = rtspService.getLatestFrameBase64(channelIndex);
//                session.sendMessage(new TextMessage(base64Frame));
//                Thread.sleep(1); // TODO: grabber.getFrameRate() 반영 가능
//            } catch (Exception e) {
//                e.printStackTrace();
//                break;
//            }
//        }
//    }
//}