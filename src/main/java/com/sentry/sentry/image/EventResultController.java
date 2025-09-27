package com.sentry.sentry.image;

import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/image")
public class EventResultController {
    private final EventResultService eventResultService;
}
