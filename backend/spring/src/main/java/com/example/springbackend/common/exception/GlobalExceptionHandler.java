package com.example.springbackend.common.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
/** コントローラーやサービスで発生した例外を共通の JSON エラー応答へ変換します。 */
public class GlobalExceptionHandler {

    @ExceptionHandler({
            BadRequestException.class,
            MethodArgumentNotValidException.class,
            HandlerMethodValidationException.class,
            HttpMessageNotReadableException.class,
            MissingServletRequestParameterException.class,
            MethodArgumentTypeMismatchException.class,
            DataIntegrityViolationException.class
    })
    /** 入力検証や形式の不備を HTTP 400 にまとめます。 */
    public ResponseEntity<ApiError> handleBadRequest(Exception exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiError("Request is invalid"));
    }

    @ExceptionHandler(ConflictException.class)
    /** データ競合を HTTP 409 として返します。 */
    public ResponseEntity<ApiError> handleConflict(ConflictException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    /** 対象が見つからない場合に HTTP 404 を返します。 */
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(UnauthorizedException.class)
    /** 認証が必要な場合に HTTP 401 を返します。 */
    public ResponseEntity<ApiError> handleUnauthorized(UnauthorizedException exception) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ApiError(exception.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    /** 個別に分類されないサーバーエラーを HTTP 500 に変換します。 */
    public ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ApiError("An unexpected server error occurred"));
    }
}
