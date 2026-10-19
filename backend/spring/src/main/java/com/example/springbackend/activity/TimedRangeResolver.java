package com.example.springbackend.activity;

import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Component;

import com.example.springbackend.common.exception.BadRequestException;

@Component
/** 時刻または秒数で渡された手動入力を、矛盾のない時刻範囲に正規化します。 */
public class TimedRangeResolver {

    /**
     * 指定された値の組み合わせから時刻範囲を計算します。
     * @param startedAt 入力された開始時刻。省略可能
     * @param endedAt 入力された終了時刻。省略可能
     * @param durationSeconds 入力された経過秒数。省略可能
     * @return 開始・終了時刻と経過秒数をそろえた範囲
     * @throws BadRequestException 入力の組み合わせが不正、または期間が正でない場合
     */
    public TimedRange resolve(Instant startedAt, Instant endedAt, Long durationSeconds) {
        // 入力された 3 値のうち、整合する 2 値から残る境界を計算します。
        if (startedAt != null && endedAt != null && durationSeconds == null) {
            if (!endedAt.isAfter(startedAt)) {
                throw new BadRequestException("endedAt must be after startedAt");
            }
            long seconds = Duration.between(startedAt, endedAt).getSeconds();
            if (seconds < 1) {
                throw new BadRequestException("Duration must be at least 1 second");
            }
            return new TimedRange(startedAt, endedAt, seconds);
        }

        if (startedAt != null && endedAt == null && durationSeconds != null) {
            validateDuration(durationSeconds);
            return new TimedRange(startedAt, startedAt.plusSeconds(durationSeconds), durationSeconds);
        }

        if (startedAt == null && endedAt != null && durationSeconds != null) {
            validateDuration(durationSeconds);
            return new TimedRange(endedAt.minusSeconds(durationSeconds), endedAt, durationSeconds);
        }

        throw new BadRequestException("Invalid timed input pattern");
    }

    private void validateDuration(Long durationSeconds) {
        if (durationSeconds == null || durationSeconds < 1) {
            throw new BadRequestException("Duration must be at least 1 second");
        }
    }
}
