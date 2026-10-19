package com.example.springbackend.summary;

import java.time.LocalDate;
import java.util.List;

import com.example.springbackend.activity.ActivitySessionResponse;
import com.example.springbackend.manual.ManualTimeEntryResponse;

/** 1 日分の合計、タグ別内訳、元となるセッションと手動記録をまとめた応答です。 */
public record DailySummaryResponse(
        LocalDate activityDate,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds,
        List<TagSummaryResponse> tagSummaries,
        List<ActivitySessionResponse> activitySessions,
        List<ManualTimeEntryResponse> manualTimeEntries) {
}
