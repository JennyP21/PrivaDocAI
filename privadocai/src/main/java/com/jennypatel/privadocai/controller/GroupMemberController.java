package com.jennypatel.privadocai.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.GroupMemberRequestDTO;
import com.jennypatel.privadocai.dto.GroupMemberResponseDTO;
import com.jennypatel.privadocai.service.GroupMemberService;

@RestController
@RequestMapping("/api/group/member")
public class GroupMemberController {

    private final GroupMemberService groupMemberService;

    public GroupMemberController(GroupMemberService groupMemberService){
        this.groupMemberService = groupMemberService;
    }

    @PostMapping("/add")
    public ResponseEntity<ApiResponse<GroupMemberResponseDTO>> addGroupMember(@RequestBody GroupMemberRequestDTO groupMemberRequestDTO) {
        GroupMemberResponseDTO groupMemberResponseDTO = groupMemberService.addMember(groupMemberRequestDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", groupMemberResponseDTO));
    }

    @PostMapping("/remove")
    public ResponseEntity<ApiResponse<Void>> removeGroupMember(@RequestBody GroupMemberRequestDTO groupMemberRequestDTO) {
        groupMemberService.removeMember(groupMemberRequestDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success"));
    }

    // NEW: Added the change role endpoint we built in the Service earlier!
    @PostMapping("/changeRole")
    public ResponseEntity<ApiResponse<GroupMemberResponseDTO>> changeMemberRole(@RequestBody GroupMemberRequestDTO groupMemberRequestDTO) {
        GroupMemberResponseDTO updatedMember = groupMemberService.changeMemberRole(groupMemberRequestDTO);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", updatedMember));
    }

    @GetMapping("/getgroups/{id}")
    public ResponseEntity<ApiResponse<List<GroupMemberResponseDTO>>> getGroupsByMember(@PathVariable UUID id) {
        List<GroupMemberResponseDTO> groups = groupMemberService.listGroupsByMember(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", groups));
    }

    @GetMapping("/getmembers/{id}")
    public ResponseEntity<ApiResponse<List<GroupMemberResponseDTO>>> getMembersByGroup(@PathVariable UUID id) {
        List<GroupMemberResponseDTO> members = groupMemberService.listMembersByGroup(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", members));
    }
}