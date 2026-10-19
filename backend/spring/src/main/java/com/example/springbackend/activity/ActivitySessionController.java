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
/** 活動セッションの取得・開始・編集・終了を HTTP API として公開します。 */
public class ActivitySessionController {

    private final ActivitySessionService sessionService;

    public ActivitySessionController(ActivitySessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping
    /** 日付指定があればその日のセッションを、なければ全件を返します。 */
    public List<ActivitySessionResponse> findByActivityDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate activityDate) {
        return sessionService.findByActivityDate(activityDate);
    }

    @GetMapping("/active")
    /** 現在進行中のセッションを返します。存在しない場合は本文が null の応答です。 */
    public ResponseEntity<ActivitySessionResponse> findActive() {
        return ResponseEntity.ok(sessionService.findActive());
    }

    @PostMapping("/start")
    /** タグと初期セグメントを指定して計測を開始します。 */
    public ResponseEntity<ActivitySessionResponse> start(
            @Valid @RequestBody StartActivitySessionRequest request) {
        return ResponseEntity.status(201).body(sessionService.start(request));
    }

    @PostMapping("/manual")
    /** 開始・終了時刻または時間から、時刻付きの手動セッションを登録します。 */
    public ResponseEntity<ActivitySessionResponse> createTimedManual(
            @Valid @RequestBody TimedManualSessionRequest request) {
        return ResponseEntity.status(201).body(sessionService.createTimedManual(request));
    }

    @PostMapping("/{sessionId}/finish")
    /** 実行中セッションと現在のセグメントを終了します。 */
    public ActivitySessionResponse finish(@PathVariable @Positive Long sessionId) {
        return sessionService.finish(sessionId);
    }

    @PostMapping("/{sessionId}/switch")
    /** 実行中セッションのセグメント種別を切り替えます。 */
    public ActivitySessionResponse switchSegment(
            @PathVariable @Positive Long sessionId,
            @Valid @RequestBody SegmentSwitchRequest request) {
        return sessionService.switchSegment(sessionId, request);
    }

    @PutMapping("/{sessionId}")
    /** セッションの基本情報と時刻範囲を更新します。 */
    public ActivitySessionResponse update(
            @PathVariable @Positive Long sessionId,
            @Valid @RequestBody ActivitySessionUpdateRequest request) {
        return sessionService.update(sessionId, request);
    }

    @DeleteMapping("/{sessionId}")
    /** セッションを削除し、本文のない HTTP 204 を返します。 */
    public ResponseEntity<Void> delete(@PathVariable @Positive Long sessionId) {
        sessionService.delete(sessionId);
        return ResponseEntity.noContent().build();
    }
}
