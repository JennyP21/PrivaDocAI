package com.jennypatel.privadocai.service;

import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.jennypatel.privadocai.dto.AuthResponseDTO;
import com.jennypatel.privadocai.entity.RefreshToken;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.repository.RefreshTokenRepo;
import com.jennypatel.privadocai.repository.UserRepo;

import jakarta.transaction.Transactional;

@Service
public class AuthService {

    private final UserRepo userRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RefreshTokenService refreshTokenService;
    private final RefreshTokenRepo refreshTokenRepo;

    public AuthService(UserRepo userRepo, JwtService jwt, PasswordEncoder encoder, RefreshTokenService refreshTokenService, RefreshTokenRepo refreshTokenRepo) {
        this.userRepository = userRepo;
        this.jwtService = jwt;
        this.passwordEncoder = encoder;
        this.refreshTokenService = refreshTokenService;
        this.refreshTokenRepo = refreshTokenRepo;
    }

    public boolean authenticate(String email, String password){
        Optional<User> user = userRepository.findByEmail(email);
        if(user.isEmpty()) return false;

        String storedPassword = user.get().getPassword();

        return passwordEncoder.matches(password, storedPassword);
    }

    @Transactional // Important for delete operations
    public AuthResponseDTO refresh(String refreshToken) {
        RefreshToken token = refreshTokenService.findByToken(refreshToken)
                .filter(t -> !refreshTokenService.isExpired(t))
                .orElseThrow(() -> new RuntimeException("Invalid or expired refresh Token"));

        String accessToken = jwtService.generateToken(token.getUser().getEmail());
        return new AuthResponseDTO(accessToken, token.getUser().getEmail());
    }

    @Transactional
    public void logout(String refreshToken){
        refreshTokenService.findByToken(refreshToken)
                .ifPresent(refreshTokenRepo::delete);
    }
}