package com.example.springbackend.summary;

import java.time.LocalDate;
import java.util.List;

import com.example.springbackend.activity.ActivitySessionResponse;
import com.example.springbackend.manual.ManualTimeEntryResponse;

public record DailySummaryResponse(
        LocalDate activityDate,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds,
        List<TagSummaryResponse> tagSummaries,
        List<ActivitySessionResponse> activitySessions,
        List<ManualTimeEntryResponse> manualTimeEntries) {
}
