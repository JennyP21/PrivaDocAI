package com.jennypatel.privadocai.dto;

import java.util.UUID;

import com.jennypatel.privadocai.entity.GroupMember.Role;

public record GroupMemberResponseDTO(
    UUID userId,
    String userEmail,
    UUID groupId,
    String groupName,
    String groupDescription,
    Role groupRole
) {}
