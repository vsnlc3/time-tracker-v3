package com.example.springbackend.common.exception;

/** 認証されていない、または必須の認証情報がないことを示します。 */
public class UnauthorizedException extends RuntimeException {

    /** エラー応答に使う理由を設定します。 */
    public UnauthorizedException(String message) {
        super(message);
    }
}
