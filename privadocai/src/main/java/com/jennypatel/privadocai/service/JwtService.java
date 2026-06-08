package com.jennypatel.privadocai.service;

import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.HexFormat;
import java.util.Map;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Value("${security.jwt.secret}")
    private String secretKey;
    
    @Value("${security.jwt.expiration-ms}")
    private Long expirationDelay;

    public String generateToken(String email){
        Map<String, Object> claims = new HashMap<>();
        Date expirationDate = Date.from(Instant.now().plusMillis(expirationDelay));
        return createToken(claims, email, expirationDate);
    }

    public String generateRefreshToken(String username, Date refreshExpirationTime){
        return createToken(new HashMap<>(), username, refreshExpirationTime);
    }

    private String createToken(Map<String, Object> claims, String email, Date expirationDate){
        return Jwts.builder()
                .subject(email)
                .claims(claims)
                .issuedAt(new Date())
                .expiration(expirationDate)
                .signWith(getSignKey())
                .compact();
    }
    
    private SecretKey getSignKey(){
        byte[] keyBytes = HexFormat.of().parseHex(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    public String extractUsername(String token){
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimResolver){
        final Claims claims = extractAllClaim(token);
        return claimResolver.apply(claims);
    }

    private Claims extractAllClaim(String token){
        return Jwts.parser()
                .verifyWith(getSignKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, String username){
        final String extractedUsername = extractUsername(token);
        return (extractedUsername.equals(username) && !isTokenExpired(token));
    }

    private boolean isTokenExpired(String token){
        return extractClaim(token, Claims::getExpiration).before(new Date());
    }

}