package com.jennypatel.privadocai.dto;

import java.util.UUID;

public record ChatSessionRequestDTO(
        UUID groupId,
        String title
) {}
