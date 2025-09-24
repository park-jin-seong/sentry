package com.sentry.sentry.its;

import com.sentry.sentry.its.dto.ItsCctvResponse;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/its/cctv")
public class ItsCctvController {

    private final ItsCctvService service;

    public ItsCctvController(ItsCctvService service) {
        this.service = service;
    }

    // 예: GET /api/its/cctv?cctvType=1&minX=126&maxX=127&minY=34&maxY=35
    @GetMapping
    public ItsCctvResponse search(
            @RequestParam int cctvType,
            @RequestParam double minX,
            @RequestParam double maxX,
            @RequestParam double minY,
            @RequestParam double maxY
    ) {
        return service.search(cctvType, minX, maxX, minY, maxY);
    }
}
