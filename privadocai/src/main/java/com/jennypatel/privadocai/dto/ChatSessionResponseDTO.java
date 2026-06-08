package com.jennypatel.privadocai.dto;

import java.time.LocalDateTime;
import java.util.UUID;

public record ChatSessionResponseDTO(
        UUID id,
        UUID groupId,
        String title,
        LocalDateTime createdAt
) {}
