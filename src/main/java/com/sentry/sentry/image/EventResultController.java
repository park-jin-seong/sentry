package com.sentry.sentry.image;

import com.sentry.sentry.entity.EventResult;
import lombok.RequiredArgsConstructor;
import org.apache.tika.Tika;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.format.annotation.DateTimeFormat;

import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/image")
public class EventResultController {

    private final EventResultService eventResultService;
    private final ImageService imageService;

    @GetMapping("/list-by-criteria")
    public List<EventResultDTO> getImagesByCriteria(
            @RequestParam(required = false) List<Long> cameraIds,
            @RequestParam(required = false) List<Long> classIds,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDateTime,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDateTime,
            @RequestParam(required = false) Long cursorId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursorTime,
            @RequestParam(required = false, defaultValue = "next") String direction
    ){
        List<EventResult> eventResultList = eventResultService.getEventResultList(
                cameraIds,
                classIds,
                startDateTime,
                endDateTime,
                cursorId,
                cursorTime,
                direction
        );

        List<EventResultDTO> allEventResultDTO = eventResultList.stream()
                .map(EventResultDTO::new)
                .collect(Collectors.toList());

        System.out.println("allEventResultDTO = " + allEventResultDTO);
        return allEventResultDTO;
    }


    @GetMapping("/stream/{eventResultId}")
    public ResponseEntity<InputStreamResource> streamImage(@PathVariable Long eventResultId) {
        Optional<ByteArrayResource> imageOpt  = imageService.getImageStreamFromSmb(eventResultId);

        if (imageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        ByteArrayResource resource = imageOpt.get();

        try (InputStream in = resource.getInputStream()) {
            Tika tika = new Tika();
            String mimeType = tika.detect(in);

            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(mimeType))
                    .body(new InputStreamResource(resource.getInputStream()));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
}