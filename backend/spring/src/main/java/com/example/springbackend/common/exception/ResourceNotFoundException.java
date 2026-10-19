package com.example.springbackend.common.exception;

/** 利用者の所有範囲内に対象リソースが見つからないことを示します。 */
public class ResourceNotFoundException extends RuntimeException {

    /** エラー応答に使う理由を設定します。 */
    public ResourceNotFoundException(String message) {
        super(message);
    }
}
