package com.sentry.sentry.its;

import com.sentry.sentry.its.dto.ItsCctvResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class ItsCctvService {

    private final RestClient rest;
    private final String apiKey;

    public ItsCctvService(
            @Value("${its.base-url}") String baseUrl,
            @Value("${its.api-key}") String apiKey
    ) {
        this.apiKey = apiKey;
        this.rest = RestClient.builder().baseUrl(baseUrl).build();
    }

    public ItsCctvResponse search(
            int cctvType, double minX, double maxX, double minY, double maxY
    ) {
        String uri = UriComponentsBuilder.fromPath("/cctvInfo")
                .queryParam("apiKey", apiKey)
                .queryParam("type", "ex")      // 고속도로(ex) 고정
                .queryParam("cctvType", cctvType)
                .queryParam("minX", minX)
                .queryParam("maxX", maxX)
                .queryParam("minY", minY)
                .queryParam("maxY", maxY)
                .queryParam("getType", "json")
                .build(true) // 인코딩 유지
                .toUriString();

        return rest.get()
                .uri(uri)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .body(ItsCctvResponse.class);
    }
}
