package com.sentry.sentry.login;

import com.sentry.sentry.entity.UserUiPref;
import com.sentry.sentry.security.CustomUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/me/ui")
public class UiPrefController {

    private final UiPrefService uiPrefService;

    @GetMapping
    public ResponseEntity<?> get(@AuthenticationPrincipal CustomUserDetails me) {
        if (me == null) return ResponseEntity.status(401).build();
        UserUiPref p = uiPrefService.getOrCreate(me.getId());
        return ResponseEntity.ok(Map.of(
                "chatOpacity", p.getChatOpacity(),
                "chatWidthPct", p.getChatWidthPct()
        ));
    }

    @PatchMapping
    public ResponseEntity<?> patch(@AuthenticationPrincipal CustomUserDetails me,
                                   @RequestBody Map<String, Object> body) {
        if (me == null) return ResponseEntity.status(401).build();

        Integer opacity  = body.containsKey("chatOpacity")
                ? toInt(body.get("chatOpacity")) : null;
        Integer widthPct = body.containsKey("chatWidthPct")
                ? toInt(body.get("chatWidthPct")) : null;

        UserUiPref p = uiPrefService.update(me.getId(), opacity, widthPct);
        return ResponseEntity.ok(Map.of(
                "chatOpacity", p.getChatOpacity(),
                "chatWidthPct", p.getChatWidthPct()
        ));
    }

    private Integer toInt(Object o) {
        if (o == null) return null;
        if (o instanceof Number n) return n.intValue();
        try { return Integer.parseInt(String.valueOf(o)); }
        catch (Exception e) { return null; }
    }
}
