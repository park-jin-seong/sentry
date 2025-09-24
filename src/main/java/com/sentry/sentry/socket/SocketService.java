package com.sentry.sentry.socket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class SocketService {
    public String getRTSPURL(String serverIp, int port, Long userId, List<Long> cameraIds) {


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


            // 필요하면 C# 쪽으로 확인 응답 보내기
            // dos.writeUTF("OK"); dos.flush();

            // 2️⃣ 이미지 수신 루프
            while (true) {
                try {
                    // 먼저 4바이트 읽기
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
                    BufferedImage image = ImageIO.read(new ByteArrayInputStream(imgBytes));
                    if (image != null) {
                        System.out.println("이미지 수신 성공: " + image.getWidth() + "x" + image.getHeight());
                        // 필요 시 WebSocket 또는 UI로 전송
                    }

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
        return "";
    }
}


