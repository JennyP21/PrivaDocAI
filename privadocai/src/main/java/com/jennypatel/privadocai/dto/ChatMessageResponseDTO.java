package com.jennypatel.privadocai.dto;

public record ChatMessageResponseDTO(
        String sender, // "user" or "ai"
        String text
) {}
