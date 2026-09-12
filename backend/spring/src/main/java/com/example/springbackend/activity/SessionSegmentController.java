package com.example.springbackend.activity;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@Validated
@RestController
@RequestMapping("/api/session-segments")
public class SessionSegmentController {

    private final ActivitySessionService sessionService;

    public SessionSegmentController(ActivitySessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PutMapping("/{segmentId}")
    public SessionSegmentResponse update(
            @PathVariable @Positive Long segmentId,
            @Valid @RequestBody SessionSegmentUpdateRequest request) {
        return sessionService.updateSegment(segmentId, request);
    }

    @DeleteMapping("/{segmentId}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long segmentId) {
        sessionService.deleteSegment(segmentId);
        return ResponseEntity.noContent().build();
    }
}
