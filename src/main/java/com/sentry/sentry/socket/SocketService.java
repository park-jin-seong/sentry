package com.sentry.sentry.socket;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.BufferedWriter;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.net.Socket;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Service
public class SocketService {
    public String getRTSPURL(String serverIp, int port, Long userId, List<Long> cameraIds) {


        StreamInfoDTO streamInfoDTO = new StreamInfoDTO(userId, cameraIds);

        try (Socket socket = new Socket(serverIp, port);
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream()))) {
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            // JSON으로 직렬화
            ObjectMapper mapper = new ObjectMapper();
            String json = mapper.writeValueAsString(streamInfoDTO);

            // 서버로 전송 (개행 포함)
            writer.write(json);
            writer.newLine();
            writer.flush();

            String RTSPURL = reader.readLine();
            System.out.println("RTSPURL: " + RTSPURL);
            System.out.println("Sent JSON to server: " + json);

            reader.close();

        } catch (Exception e) {
            e.printStackTrace();
        }
        return "";
    }
}


