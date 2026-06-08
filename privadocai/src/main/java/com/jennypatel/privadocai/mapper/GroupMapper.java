package com.jennypatel.privadocai.mapper;

import org.springframework.stereotype.Component;

import com.jennypatel.privadocai.dto.GroupRequestDTO;
import com.jennypatel.privadocai.dto.GroupResponseDTO;
import com.jennypatel.privadocai.entity.Group;

@Component
public class GroupMapper {
    public GroupResponseDTO toDTO(Group group){
        return new GroupResponseDTO(group.getId(), group.getName(), group.getDescription(), group.getCreatedAt());
    }

    public Group toEntity(GroupRequestDTO groupRequestDTO){
        Group group = new Group();
        group.setName(groupRequestDTO.name());
        group.setDesc(groupRequestDTO.description());
        return group;
    }
}
