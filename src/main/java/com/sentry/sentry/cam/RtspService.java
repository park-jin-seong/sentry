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
//
//    private final BlockingQueue<String>[] frameQueues = new LinkedBlockingQueue[rtspList.length];
//    private final FFmpegFrameGrabber[] grabbers = new FFmpegFrameGrabber[rtspList.length];
//    private final Java2DFrameConverter converter = new Java2DFrameConverter();
//    private final Thread[] threads = new Thread[rtspList.length];
//
//    @PostConstruct
//    public void init() {
//        for (int i = 0; i < rtspList.length; i++) {
//            frameQueues[i] = new LinkedBlockingQueue<>(3);
//            int channel = i;
//
//            threads[i] = new Thread(() -> {
//                while (true) {
//                    try (FFmpegFrameGrabber grabber = new FFmpegFrameGrabber(rtspList[channel])) {
//                        grabbers[channel] = grabber;
//
//
//                        grabber.setOption("rtsp_transport", "tcp");
//                        grabber.setOption("stimeout", "5000000");
//                        grabber.setFrameRate(15);
//                        grabber.setImageWidth(640);
//                        grabber.setImageHeight(360);
//
//                        grabber.start();
//                        Frame frame;
//
//                        while ((frame = grabber.grabImage()) != null) {
//                            BufferedImage img = converter.convert(frame);
//                            if (img == null) continue;
//
//
//                            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
//                                ImageIO.write(img, "jpg", baos);
//                                String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());
//
//                                if (!frameQueues[channel].offer(base64)) {
//                                    frameQueues[channel].poll();
//                                    frameQueues[channel].offer(base64);
//                                }
//                            } catch (Exception ignored) {}
//                        }
//                    } catch (Exception e) {
//
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
//
//    public String getLatestFrameBase64(int channel) {
//        if (channel < 0 || channel >= frameQueues.length) return "";
//        String frame = frameQueues[channel].peek();
//        return frame != null ? frame : "";
//    }
//
//    @PreDestroy
//    public void destroy() {
//
//        for (FFmpegFrameGrabber grabber : grabbers) {
//            if (grabber != null) {
//                try { grabber.stop(); grabber.release(); } catch (Exception ignored) {}
//            }
//        }
//    }
//}
