package com.example.springbackend.summary;

/** 1 タグに紐づく合計・集中・休憩時間を表す集計結果です。 */
public record TagSummaryResponse(
        Long tagId,
        String tagDisplayName,
        Long totalSeconds,
        Long focusSeconds,
        Long breakSeconds) {
}
