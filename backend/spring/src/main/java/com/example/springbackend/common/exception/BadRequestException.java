package com.example.springbackend.common.exception;

/** リクエスト値や操作がアプリケーション上の入力条件を満たさないことを示します。 */
public class BadRequestException extends RuntimeException {

    /** エラー応答に使う理由を設定します。 */
    public BadRequestException(String message) {
        super(message);
    }
}
