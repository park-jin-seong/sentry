package com.sentry.sentry.its;

import com.sentry.sentry.its.ItsCctvService;
import com.sentry.sentry.its.dto.ItsCctvResponse;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/its")
class ItsCctvController {

    private final ItsCctvService service;

    @GetMapping("/cctv")
    public ResponseEntity<ItsCctvResponse> search(
            @RequestParam(defaultValue = "its") String type,      // ex | its
            @RequestParam(defaultValue = "1") int cctvType,
            @RequestParam double minX,
            @RequestParam double maxX,
            @RequestParam double minY,
            @RequestParam double maxY
    ) {
        return ResponseEntity.ok(
                service.search(type, cctvType, minX, maxX, minY, maxY)
        );
    }
}
