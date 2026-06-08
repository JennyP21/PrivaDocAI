package com.jennypatel.privadocai.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jennypatel.privadocai.entity.GroupMember;
import com.jennypatel.privadocai.entity.GroupMemberId;

@Repository
public interface GroupMemberRepo extends JpaRepository<GroupMember, GroupMemberId> {
    List<GroupMember> findByUser_Id(UUID userId); 
    List<GroupMember> findByGroup_Id(UUID groupId);
}
