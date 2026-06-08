package com.jennypatel.privadocai.dto;

import java.util.UUID;

import com.jennypatel.privadocai.entity.GroupMember.Role;

public record GroupMemberRequestDTO(
    UUID userId,
    UUID groupId,
    Role groupRole
) {}
