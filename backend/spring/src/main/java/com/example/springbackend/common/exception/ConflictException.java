package com.example.springbackend.common.exception;

/** リクエストが既存データとの競合により実行できないことを示します。 */
public class ConflictException extends RuntimeException {

    /** エラー応答に使う理由を設定します。 */
    public ConflictException(String message) {
        super(message);
    }
}
