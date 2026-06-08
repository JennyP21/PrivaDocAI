package com.jennypatel.privadocai.dto;

import java.util.UUID;

public record UserResponseDTO(
    UUID id,
    String email,
    Boolean isSystemAdmin
) {}
