package com.jennypatel.privadocai.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.jennypatel.privadocai.dto.ApiResponse;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Handle standard Runtime Exceptions (e.g., "User not found")
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Void>> handleRuntimeException(RuntimeException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST); // 400 Status
    }

    // 2. Handle Security/Auth Exceptions (403 Forbidden)
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Void>> handleAccessDeniedException(AccessDeniedException ex) {
        ApiResponse<Void> response = new ApiResponse<>(false, "Access Denied: " + ex.getMessage());
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN); 
    }

    // 3. Handle Absolute Catastrophes (500 Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleGlobalException(Exception ex) {
        // You would log the real error here for your own debugging
        ex.printStackTrace(); 
        
        ApiResponse<Void> response = new ApiResponse<>(false, "An unexpected internal server error occurred.");
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}