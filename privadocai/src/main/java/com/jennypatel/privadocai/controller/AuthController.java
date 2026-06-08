package com.jennypatel.privadocai.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.AuthRequestDTO;
import com.jennypatel.privadocai.dto.AuthResponseDTO;
import com.jennypatel.privadocai.service.AuthService;
import com.jennypatel.privadocai.service.JwtService;
import com.jennypatel.privadocai.service.RefreshTokenService;

import jakarta.servlet.http.HttpServletResponse;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthService authService, JwtService jwtService, RefreshTokenService refreshTokenService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> login(@RequestBody AuthRequestDTO authRequestDTO, HttpServletResponse response){
        String email = authRequestDTO.email();
        String password = authRequestDTO.password();
        boolean isAuthenticated = authService.authenticate(email, password);

        if(!isAuthenticated) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ApiResponse<>(isAuthenticated, "Invalid email or password"));

        String accessToken = jwtService.generateToken(email);
        String refreshToken = refreshTokenService.createRefreshToken(email).getToken();

        ResponseCookie cookie = ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(false) // Change to true in production
                .path("/")
                .maxAge(7 * 24 * 60 * 60)
                .sameSite("Lax")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());
        AuthResponseDTO authResponse = new AuthResponseDTO(accessToken, email);
        return ResponseEntity.ok(new ApiResponse<AuthResponseDTO>(isAuthenticated, "Success", authResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponseDTO>> refresh(@CookieValue(name = "refreshToken", required = false) String refreshToken){
        if(refreshToken == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(new ApiResponse<>(false, "Invalid request"));
        }
        AuthResponseDTO authResponse = authService.refresh(refreshToken);
        return ResponseEntity.ok(new ApiResponse<AuthResponseDTO>(true, "Success", authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<?>> logout(@CookieValue(name = "refreshToken", required = false) String refreshToken , HttpServletResponse response){
        if(refreshToken != null){
            authService.logout(refreshToken);
        }

        ResponseCookie cleanCookie = ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false) // Change to true in production
                .path("/")
                .maxAge(0)
                .sameSite("Strict")
                .build();

        response.addHeader(HttpHeaders.SET_COOKIE, cleanCookie.toString());

        return ResponseEntity.ok(new ApiResponse<>(true, "Success"));
    }
}
