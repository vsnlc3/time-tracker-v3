package com.example.springbackend.activity;

import java.time.Instant;

public record TimedRange(Instant startedAt, Instant endedAt, long durationSeconds) {
}
