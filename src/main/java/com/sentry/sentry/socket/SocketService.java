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
            byte[] triggerBytes = (trigger + "\n").getBytes("UTF-8");
            dos.write(triggerBytes);
            dos.flush();

            StreamInfoDTO streamInfoDTO = new StreamInfoDTO(userId, cameraIds);
            String json = mapper.writeValueAsString(streamInfoDTO);
            byte[] triggerBytes1 = (json + "\n").getBytes("UTF-8");
            dos.write(triggerBytes1);
            dos.flush();

            while (true) {
                try {
                    byte[] lenBytes = new byte[4];
                    dis.readFully(lenBytes); // 정확히 4바이트 채움

                    int length = ((lenBytes[0] & 0xFF) << 24) |
                            ((lenBytes[1] & 0xFF) << 16) |
                            ((lenBytes[2] & 0xFF) << 8)  |
                            (lenBytes[3] & 0xFF);

                    byte[] imgBytes = new byte[length];
                    dis.readFully(imgBytes);

                    BufferedImage image = ImageIO.read(new ByteArrayInputStream(imgBytes));
                    if (image != null) {
                        System.out.println("이미지 수신 성공: " + image.getWidth() + "x" + image.getHeight());
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


