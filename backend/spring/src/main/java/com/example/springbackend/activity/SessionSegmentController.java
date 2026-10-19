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
/** 個々のセッションセグメントを編集・削除する API を提供します。 */
public class SessionSegmentController {

    private final ActivitySessionService sessionService;

    public SessionSegmentController(ActivitySessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PutMapping("/{segmentId}")
    /** セグメントの時刻と区分を更新します。 */
    public SessionSegmentResponse update(
            @PathVariable @Positive Long segmentId,
            @Valid @RequestBody SessionSegmentUpdateRequest request) {
        return sessionService.updateSegment(segmentId, request);
    }

    @DeleteMapping("/{segmentId}")
    /** セグメントを削除し、本文のない HTTP 204 を返します。 */
    public ResponseEntity<Void> delete(@PathVariable @Positive Long segmentId) {
        sessionService.deleteSegment(segmentId);
        return ResponseEntity.noContent().build();
    }
}
