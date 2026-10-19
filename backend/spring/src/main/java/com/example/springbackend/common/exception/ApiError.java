package com.example.springbackend.common.exception;

/** API エラー応答でクライアントに伝えるメッセージを表します。 */
public record ApiError(String message) {
}
