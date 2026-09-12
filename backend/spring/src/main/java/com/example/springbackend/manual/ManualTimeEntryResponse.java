package com.example.springbackend.manual;

import java.time.LocalDate;

public record ManualTimeEntryResponse(
        Long id,
        Long tagId,
        String tagDisplayName,
        LocalDate activityDate,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds) {

    public static ManualTimeEntryResponse from(ManualTimeEntry entry) {
        return new ManualTimeEntryResponse(
                entry.getId(),
                entry.getTag().getId(),
                entry.getTag().getDisplayName(),
                entry.getActivityDate(),
                entry.getTotalSeconds(),
                entry.getFocusSeconds(),
                entry.getBreakSeconds());
    }
}
