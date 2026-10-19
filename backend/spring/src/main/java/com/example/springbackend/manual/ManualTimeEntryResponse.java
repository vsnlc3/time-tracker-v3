package com.example.springbackend.manual;

import java.time.LocalDate;

/** 手動記録の API 応答です。画面表示用にタグ名も含めます。 */
public record ManualTimeEntryResponse(
        Long id,
        Long tagId,
        String tagDisplayName,
        LocalDate activityDate,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds) {

    /** エンティティから API 応答を作成します。 */
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
