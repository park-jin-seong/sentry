package com.sentry.sentry.socket;

import com.fasterxml.jackson.databind.ObjectMapper;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.Socket;
import java.util.Base64;
import java.util.List;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;

public class FrameSocketThreadClass {
    private String serverIp;
    private int port;
    private Long userId;
    private List<Long> cameraIds;

    private Thread m_thread;
    private boolean m_running;

    private BlockingQueue<String> frameQueues;

    public FrameSocketThreadClass(String serverIp, int port, Long userId, List<Long> cameraIds) {
        this.serverIp = serverIp;
        this.port = port;
        this.userId = userId;
        this.cameraIds = cameraIds;
        m_thread = new Thread(() ->{
            Run();
        });
        frameQueues = new LinkedBlockingQueue<>(1);
    }
    public void Start()
    {
        boolean isAlive = !m_thread.isAlive();
        if (m_thread != null && isAlive)
        {
            m_running = true;
            m_thread.start();
        }
    }

    public void Stop() throws InterruptedException {
        m_running = false;
        m_thread.join();
    }

    public String getLatestFrameBase64() {
        String frame = frameQueues.peek();
        return frame != null ? frame : "";
    }

    private void Run()
    {
        while (m_running)
        {
            try (Socket socket = new Socket(serverIp, port);
                 DataInputStream dis = new DataInputStream(socket.getInputStream());
                 DataOutputStream dos = new DataOutputStream(socket.getOutputStream())) {

                ObjectMapper mapper = new ObjectMapper();

                String trigger = "render";
                byte[] triggerBytes = (trigger + "\n").getBytes("UTF-8");  // 개행 포함
                dos.write(triggerBytes);
                dos.flush();

                StreamInfoDTO streamInfoDTO = new StreamInfoDTO(userId, cameraIds);
                String json = mapper.writeValueAsString(streamInfoDTO);
                byte[] triggerBytes1 = (json + "\n").getBytes("UTF-8");  // 개행 포함
                dos.write(triggerBytes1);
                dos.flush();


                while (true) {
                    try {
                        byte[] lenBytes = new byte[4];
                        dis.readFully(lenBytes); // 정확히 4바이트 채움

                        // big-endian → int 변환
                        int length = ((lenBytes[0] & 0xFF) << 24) |
                                ((lenBytes[1] & 0xFF) << 16) |
                                ((lenBytes[2] & 0xFF) << 8)  |
                                (lenBytes[3] & 0xFF);

                        // 이제 length만큼 데이터 읽기
                        byte[] imgBytes = new byte[length];
                        dis.readFully(imgBytes);


                        // BufferedImage 변환
                        BufferedImage img = ImageIO.read(new ByteArrayInputStream(imgBytes));

                        if (img == null) continue;

                        // 프레임을 Base64로 바로 변환
                        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                            ImageIO.write(img, "jpg", baos);
                            String base64 = Base64.getEncoder().encodeToString(baos.toByteArray());

                            if (!frameQueues.offer(base64)) {
                                frameQueues.poll(); // 오래된 프레임 제거
                                frameQueues.offer(base64);
                            }
                        } catch (Exception ignored) {}

                    } catch (EOFException eof) {
                        System.out.println("C# 서버 연결 종료");
                        break;
                    } catch (IOException e) {
                        e.printStackTrace();
                        break;
                    }
                }

            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }


}
