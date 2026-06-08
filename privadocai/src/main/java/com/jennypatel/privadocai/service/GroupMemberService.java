package com.jennypatel.privadocai.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;

import com.jennypatel.privadocai.dto.GroupMemberRequestDTO;
import com.jennypatel.privadocai.dto.GroupMemberResponseDTO;
import com.jennypatel.privadocai.entity.Group;
import com.jennypatel.privadocai.entity.GroupMember;
import com.jennypatel.privadocai.entity.GroupMemberId;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.mapper.GroupMemberMapper;
import com.jennypatel.privadocai.repository.GroupMemberRepo;
import com.jennypatel.privadocai.repository.GroupRepo;
import com.jennypatel.privadocai.repository.UserRepo;

@Service
public class GroupMemberService {
    private GroupMemberRepo groupMemberRepo;
    private GroupMemberMapper groupMemberMapper;
    private GroupRepo groupRepo;
    private UserRepo userRepo;

    public GroupMemberService(GroupMemberRepo groupMemberRepo, GroupMemberMapper groupMemberMapper, GroupRepo groupRepo, UserRepo userRepo){
        this.groupMemberRepo = groupMemberRepo;
        this.groupMemberMapper = groupMemberMapper;
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
    }

    public User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();        
        String email = auth.getName();
        return userRepo.findByEmail(email).orElseThrow(() -> new AccessDeniedException("Authenticated user not found in database"));
    }

    private Boolean isSystemAdmin(User currentAuthenticatedUser){
        if (currentAuthenticatedUser == null || !currentAuthenticatedUser.getIsSystemAdmin()) {
            return false;
        }
        return true; 
    }

    public void verifyGroupOwnerOrSystemAdmin(@NonNull UUID groupId) {
        User currentUser = getCurrentAuthenticatedUser();

        if (isSystemAdmin(currentUser)) {
            return; 
        }

        GroupMemberId requesterMembershipId = new GroupMemberId(currentUser.getId(), groupId);
        
        GroupMember requesterMembership = groupMemberRepo.findById(requesterMembershipId)
            .orElseThrow(() -> new AccessDeniedException("Access Denied: You are not a member of this group."));

        if (!requesterMembership.getGroupRole().equals(GroupMember.Role.OWNER)) {
            throw new AccessDeniedException("Access Denied: Only group owners or system admins can perform this action.");
        }
    }

    public void verifyGroupMemberOrSystemAdmin(@NonNull UUID groupId) {
        User currentUser = getCurrentAuthenticatedUser();

        if (isSystemAdmin(currentUser)) {
            return;
        }

        GroupMemberId requesterMembershipId = new GroupMemberId(currentUser.getId(), groupId);
        if (!groupMemberRepo.existsById(requesterMembershipId)) {
            throw new AccessDeniedException("Access Denied: You must be a member of this group to view its details.");
        }
    }

    // Add Member
    public GroupMemberResponseDTO addMember(GroupMemberRequestDTO groupMemberRequestDTO){
        UUID groupId = groupMemberRequestDTO.groupId();
        UUID userId = groupMemberRequestDTO.userId();
        
        verifyGroupOwnerOrSystemAdmin(groupId);
        
        Group group = groupRepo.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        User user = userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        GroupMember groupMember = new GroupMember();
        groupMember.setGroup(group);
        groupMember.setUser(user);
        groupMember.setGroupRole(groupMemberRequestDTO.groupRole());

        GroupMember newGroupMember = groupMemberRepo.save(groupMember);

        return groupMemberMapper.toDTO(newGroupMember);
    }

    // Remove Member
    public void removeMember(GroupMemberRequestDTO groupMemberRequestDTO){
        UUID groupId = groupMemberRequestDTO.groupId();
        UUID userId = groupMemberRequestDTO.userId();
        
        verifyGroupOwnerOrSystemAdmin(groupId);
        
        groupRepo.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        userRepo.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));

        GroupMemberId groupMemberId = new GroupMemberId(userId, groupId);

        groupMemberRepo.deleteById(groupMemberId);
    }

    // --- NEW: Change Member Role ---
    public GroupMemberResponseDTO changeMemberRole(GroupMemberRequestDTO requestDTO) {
        UUID groupId = requestDTO.groupId();
        UUID targetUserId = requestDTO.userId();
        
        // 1. Verify the requester is an OWNER or System Admin
        verifyGroupOwnerOrSystemAdmin(groupId);

        // 2. Find the target member in the database
        GroupMemberId targetMemberId = new GroupMemberId(targetUserId, groupId);
        GroupMember targetMember = groupMemberRepo.findById(targetMemberId)
            .orElseThrow(() -> new RuntimeException("Target user is not a member of this group"));

        // 3. Update their role and save
        targetMember.setGroupRole(requestDTO.groupRole());
        GroupMember updatedMember = groupMemberRepo.save(targetMember);

        return groupMemberMapper.toDTO(updatedMember);
    }

    // List Members By Group
    public List<GroupMemberResponseDTO> listMembersByGroup(@NonNull UUID groupId){
        groupRepo.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));
        
        verifyGroupMemberOrSystemAdmin(groupId);

        List<GroupMemberResponseDTO> groupMembers = groupMemberRepo.findByGroup_Id(groupId).stream().map(entity -> {
            return groupMemberMapper.toDTO(entity);
        }).collect(Collectors.toList());

        return groupMembers;
    }

    // List Groups By Member
    public List<GroupMemberResponseDTO> listGroupsByMember(UUID targetUserId){
        userRepo.findById(targetUserId).orElseThrow(() -> new RuntimeException("User not found"));
        
        User currentUser = getCurrentAuthenticatedUser();
        if (!currentUser.getId().equals(targetUserId) && !isSystemAdmin(currentUser)) {
            throw new AccessDeniedException("Access Denied: You cannot view the private group list of another user.");
        }

        List<GroupMemberResponseDTO> groups = groupMemberRepo.findByUser_Id(targetUserId).stream().map(entity -> {
            return groupMemberMapper.toDTO(entity);
        }).collect(Collectors.toList());

        return groups;
    }
}