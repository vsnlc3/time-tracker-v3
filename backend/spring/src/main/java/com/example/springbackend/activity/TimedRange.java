package com.example.springbackend.activity;

import java.time.Instant;

/** 入力形式を解決した、開始・終了時刻と計算済み秒数の組です。 */
public record TimedRange(Instant startedAt, Instant endedAt, long durationSeconds) {
}
