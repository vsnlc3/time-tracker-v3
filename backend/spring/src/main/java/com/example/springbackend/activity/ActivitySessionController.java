package com.example.springbackend.activity;

import java.time.LocalDate;
import java.util.List;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@Validated
@RestController
@RequestMapping("/api/activity-sessions")
public class ActivitySessionController {

    private final ActivitySessionService sessionService;

    public ActivitySessionController(ActivitySessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    public List<ActivitySessionResponse> findByActivityDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate activityDate) {
        return sessionService.findByActivityDate(activityDate);
    }

    @GetMapping("/active")
    public ResponseEntity<ActivitySessionResponse> findActive() {
        return ResponseEntity.ok(sessionService.findActive());
    }

    @PostMapping("/start")
    public ResponseEntity<ActivitySessionResponse> start(
            @Valid @RequestBody StartActivitySessionRequest request) {
        return ResponseEntity.status(201).body(sessionService.start(request));
    }

    @PostMapping("/manual")
    public ResponseEntity<ActivitySessionResponse> createTimedManual(
            @Valid @RequestBody TimedManualSessionRequest request) {
        return ResponseEntity.status(201).body(sessionService.createTimedManual(request));
    }

    @PostMapping("/{sessionId}/finish")
    public ActivitySessionResponse finish(@PathVariable @Positive Long sessionId) {
        return sessionService.finish(sessionId);
    }

    @PostMapping("/{sessionId}/switch")
    public ActivitySessionResponse switchSegment(
            @PathVariable @Positive Long sessionId,
            @Valid @RequestBody SegmentSwitchRequest request) {
        return sessionService.switchSegment(sessionId, request);
    }

    @PutMapping("/{sessionId}")
    public ActivitySessionResponse update(
            @PathVariable @Positive Long sessionId,
            @Valid @RequestBody ActivitySessionUpdateRequest request) {
        return sessionService.update(sessionId, request);
    }

    @DeleteMapping("/{sessionId}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long sessionId) {
        sessionService.delete(sessionId);
        return ResponseEntity.noContent().build();
    }
}
