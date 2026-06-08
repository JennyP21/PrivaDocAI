package com.jennypatel.privadocai.dto;

import java.util.List;

public record ChatResponseDTO(
        String answer,
        List<ReferenceChunkDTO> references
) {}
