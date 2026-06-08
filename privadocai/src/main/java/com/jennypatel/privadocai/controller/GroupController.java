package com.jennypatel.privadocai.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.GroupRequestDTO;
import com.jennypatel.privadocai.dto.GroupResponseDTO;
import com.jennypatel.privadocai.service.GroupService;

@RestController
@RequestMapping("/api/group")
public class GroupController {
    
    private final GroupService groupService;

    public GroupController(GroupService groupService){
        this.groupService = groupService;
    }

    @PostMapping("/isAvailable")
    public ResponseEntity<ApiResponse<Boolean>> isGroupNameAvailable(@RequestBody String groupName) {
        Boolean isAvailable = groupService.isGroupNameAvailable(groupName);
        return ResponseEntity.ok(new ApiResponse<Boolean>(true, groupName, isAvailable));
    }
    
    @PostMapping("/create")
    public ResponseEntity<ApiResponse<GroupResponseDTO>> createGroup(@RequestBody GroupRequestDTO groupRequestDTO) {
        GroupResponseDTO groupResponse = groupService.createGroup(groupRequestDTO);
        return ResponseEntity.ok(new ApiResponse<GroupResponseDTO>(true, "Success", groupResponse));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Boolean>> deleteGroup(@PathVariable UUID id) {
        groupService.deleteGroup(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success"));
    }

    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<GroupResponseDTO>>> getAllGroups() {
        List<GroupResponseDTO> groups = groupService.getAllGroups();
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", groups));
    }
}
