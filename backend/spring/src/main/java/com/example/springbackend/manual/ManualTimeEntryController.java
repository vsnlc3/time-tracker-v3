package com.example.springbackend.manual;

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
@RequestMapping("/api/manual-time-entries")
/** 日単位の手動時間記録を取得・作成・編集・削除する API を提供します。 */
public class ManualTimeEntryController {

    private final ManualTimeEntryService entryService;

    public ManualTimeEntryController(ManualTimeEntryService entryService) {
        this.entryService = entryService;
    }

    @GetMapping
    /** 日付指定があればその日の記録を、なければ利用者の全記録を返します。 */
    public List<ManualTimeEntryResponse> findByActivityDate(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate activityDate) {
        return entryService.findByActivityDate(activityDate);
    }

    @PostMapping
    /** 手動記録を作成し、作成した値を HTTP 201 で返します。 */
    public ResponseEntity<ManualTimeEntryResponse> create(
            @Valid @RequestBody ManualTimeEntryRequest request) {
        return ResponseEntity.status(201).body(entryService.create(request));
    }

    @PutMapping("/{entryId}")
    /** 指定された手動記録を更新します。 */
    public ManualTimeEntryResponse update(
            @PathVariable @Positive Long entryId,
            @Valid @RequestBody ManualTimeEntryRequest request) {
        return entryService.update(entryId, request);
    }

    @DeleteMapping("/{entryId}")
    /** 手動記録を削除し、本文のない HTTP 204 を返します。 */
    public ResponseEntity<Void> delete(@PathVariable @Positive Long entryId) {
        entryService.delete(entryId);
        return ResponseEntity.noContent().build();
    }
}
