package com.jennypatel.privadocai.dto;

import java.util.UUID;

public record DocumentStatusDTO(
        UUID id,
        String status
) {}
