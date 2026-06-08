package com.jennypatel.privadocai.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record GroupResponseDTO(
    UUID id,
    String name,
    String description,
    LocalDateTime createdAt
) {}
