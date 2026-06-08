package com.jennypatel.privadocai.dto;

import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;

public record DocumentRequestDTO(
    MultipartFile[] files,
    UUID groupId
) {}
