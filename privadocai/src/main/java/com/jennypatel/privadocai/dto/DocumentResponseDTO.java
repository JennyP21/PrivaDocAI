package com.jennypatel.privadocai.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import com.jennypatel.privadocai.entity.Document.DocumentStatus;

public record DocumentResponseDTO(
    UUID id,
    String originalFileName,
    String mimeType,
    DocumentStatus status,
    UUID groupId,
    UUID uploadedById,
    LocalDateTime uploadedAt
) {}
