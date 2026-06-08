package com.jennypatel.privadocai.dto;

import java.util.UUID;

public record ChatRequestDTO(
        UUID sessionId,
        String question
) {}
