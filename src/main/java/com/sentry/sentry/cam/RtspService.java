//package com.sentry.sentry.cam;
//
//import jakarta.annotation.PostConstruct;
//import jakarta.annotation.PreDestroy;
//import org.bytedeco.javacv.FFmpegFrameGrabber;
//import org.bytedeco.javacv.Frame;
//import org.bytedeco.javacv.Java2DFrameConverter;
//import org.springframework.stereotype.Service;
//
//import javax.imageio.ImageIO;
//import java.awt.image.BufferedImage;
//import java.io.ByteArrayOutputStream;
//import java.util.Base64;
//import java.util.concurrent.BlockingQueue;
//import java.util.concurrent.LinkedBlockingQueue;
//
//@Service
//public class RtspService {
//
//    private final String[] rtspList = {
//            "http://cctvsec.ktict.co.kr/149/nFkiJmSnQdzSaJDEmBGCvFgZUdPlUrWvkDbV8Jm7WkpoZsPkzMyXJ5YTQ8unOgtmSwxjyyGOSvywfyvFS7LBS+S+dV0CwUiwHoW7iZEYuW0="
//    };
//
//    // 프레임 대신 Base64 문자열을 큐에 저장
//    private final BlockingQueue<String>[] frameQueues = new LinkedBlockingQueue[rtspList.length];
//    private final FFmpegFrameGrabber[] grabbers = new FFmpegFrameGrabber[rtspList.length];
//    private final Java2DFrameConverter converter = new Java2DFrameConverter();
//    private final Thread[] threads = new Thread[rtspList.length];
//
//    @PostConstruct
//    public void init() {
//        for (int i = 0; i < rtspList.length; i++) {
//            frameQueues[i] = new LinkedBlockingQueue<>(3); // 최신 3프레임 유지
//            int channel = i;
//
//            threads[i] = new Thread(() -> {
//                while (true) {
//                    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(rtspList[channel])) {
//                        grabbers[channel] = grabber;
//
//                        // 안정성을 위한 옵션 설정
//                        grabber.setOption("rtsp_transport", "tcp"); // TCP 모드
//                        grabber.setOption("stimeout", "5000000");   // 5초 타임아웃
//                        grabber.setFrameRate(15);                   // FPS 제한
//                        grabber.setImageWidth(640);                 // 해상도 줄이기 (옵션)
//                        grabber.setImageHeight(360);
//
//                        grabber.start();
//                        Frame frame;
//
//                        while ((frame = grabber.grabImage()) != null) {
//                            BufferedImage img = converter.convert(frame);
//                            if (img == null) continue;
//
//                            // 프레임을 Base64로 바로 변환
//                            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
//                                ImageIO.write(img, "jpg", baos);
//                                String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
//
//                                if (!frameQueues[channel].offer(base64)) {
//                                    frameQueues[channel].poll(); // 오래된 프레임 제거
//                                    frameQueues[channel].offer(base64);
//                                }
//                            } catch (Exception ignored) {}
//                        }
//                    } catch (Exception e) {
//                        // 연결 실패 → 잠시 대기 후 재시도
//                        try { Thread.sleep(3000); } catch (InterruptedException ignored) {}
//                    }
//                }
//            }, "rtsp-thread-" + i);
//
//            threads[i].setDaemon(true);
//            threads[i].start();
//        }
//    }
//
//    // 클라이언트 요청 시 최신 Base64 프레임 리턴
//    public String getLatestFrameBase64(int channel) {
//        if (channel < 0 || channel >= frameQueues.length) return "";
//        String frame = frameQueues[channel].peek();
//        return frame != null ? frame : "";
//    }
//
//    @PreDestroy
//    public void destroy() {
//        // 애플리케이션 종료 시 grabber 안전 종료
//        for (FFmpegFrameGrabber grabber : grabbers) {
//            if (grabber != null) {
//                try { grabber.stop(); grabber.release(); } catch (Exception ignored) {}
//            }
//        }
//    }
//}
