package com.jennypatel.privadocai.mapper;

import org.springframework.stereotype.Component;

import com.jennypatel.privadocai.dto.GroupMemberResponseDTO;
import com.jennypatel.privadocai.entity.GroupMember;

@Component
public class GroupMemberMapper {
    public GroupMemberResponseDTO toDTO(GroupMember groupMember){
        return new GroupMemberResponseDTO(
            groupMember.getUser().getId(),
            groupMember.getUser().getEmail(),
            groupMember.getGroup().getId(),
            groupMember.getGroup().getName(),
            groupMember.getGroup().getDescription(),
            groupMember.getGroupRole()
        );
    }
}
