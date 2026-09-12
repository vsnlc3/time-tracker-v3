package com.example.springbackend.activity;

import java.time.Duration;
import java.time.Instant;

import org.springframework.stereotype.Component;

import com.example.springbackend.common.exception.BadRequestException;

@Component
public class TimedRangeResolver {

    public TimedRange resolve(Instant startedAt, Instant endedAt, Long durationSeconds) {
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
