package com.sentry.sentry.its;

import com.sentry.sentry.its.dto.ItsCctvResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class ItsCctvService {

    /** 도로 타입 */
    public enum RoadType {
        EX("ex"),   // 고속도로
        ITS("its"); // 국도

        private final String code;
        RoadType(String code) { this.code = code; }
        public String code() { return code; }

        public static RoadType from(String raw) {
            if (raw == null) throw new IllegalArgumentException("type 파라미터가 없습니다.");
            switch (raw.trim().toLowerCase()) {
                case "ex":  return EX;
                case "its": return ITS;
                default:    throw new IllegalArgumentException("type은 ex 또는 its 만 허용됩니다. (입력: " + raw + ")");
            }
        }
    }

    private final RestClient rest;
    private final String apiKey;

    public ItsCctvService(
            @Value("${its.base-url}") String baseUrl,
            @Value("${its.api-key}") String apiKey
    ) {
        this.apiKey = apiKey;
        this.rest = RestClient.builder().baseUrl(baseUrl).build();
    }

    /** 문자열 type(ex|its) 받는 편의 메서드 */
    public ItsCctvResponse search(
            String roadType, int cctvType,
            double minX, double maxX, double minY, double maxY
    ) {
        return search(RoadType.from(roadType), cctvType, minX, maxX, minY, maxY);
    }

    /** Enum type 받는 본 메서드 */
    public ItsCctvResponse search(
            RoadType type, int cctvType,
            double minX, double maxX, double minY, double maxY
    ) {
        String uri = UriComponentsBuilder.fromPath("/cctvInfo")
                .queryParam("apiKey", apiKey)
                .queryParam("type", type.code())   // ★ 선택된 타입 적용
                .queryParam("cctvType", cctvType)
                .queryParam("minX", minX)
                .queryParam("maxX", maxX)
                .queryParam("minY", minY)
                .queryParam("maxY", maxY)
                .queryParam("getType", "json")
                .build(true)
                .toUriString();

        return rest.get()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(ItsCctvResponse.class);
    }
}
