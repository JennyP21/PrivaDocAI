package com.jennypatel.privadocai.service;

import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.entity.RefreshToken;
import com.jennypatel.privadocai.repository.UserRepo;
import com.jennypatel.privadocai.repository.RefreshTokenRepo;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Date;
import java.util.Optional;

@Service
public class RefreshTokenService {

    @Value("${security.jwt.refresh-expiration-ms}")
    private Long refreshExpirationDelay;

    private final RefreshTokenRepo refreshTokenRepository;
    private final UserRepo userRepo;
    private final JwtService jwtService;

    public RefreshTokenService(RefreshTokenRepo refreshTokenRepository, UserRepo userRepo, JwtService jwtService) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepo = userRepo;
        this.jwtService = jwtService;
    }

    @Transactional
    public RefreshToken createRefreshToken(String email){
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Account not found"));

        // 1. Delete the old token
        refreshTokenRepository.deleteByUser(user);

        // 2. FORCE Hibernate to execute the delete query NOW
        refreshTokenRepository.flush();

        Instant refreshExpiryInstant = Instant.now().plusMillis(refreshExpirationDelay);

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUser(user);
        refreshToken.setToken(jwtService.generateRefreshToken(email, Date.from(refreshExpiryInstant)));
        refreshToken.setExpiryDate(refreshExpiryInstant);
        
        return refreshTokenRepository.save(refreshToken);
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public boolean isExpired(RefreshToken token) {
        if (token.getExpiryDate().isBefore(Instant.now())) {
            refreshTokenRepository.delete(token);
            return true;
        }
        return false;
    }

}
