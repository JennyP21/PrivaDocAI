package com.jennypatel.privadocai.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.MapsId;
import jakarta.persistence.Table;

@Entity
@Table(name = "group_members")
public class GroupMember {
    @EmbeddedId
    private GroupMemberId id = new GroupMemberId();

    public enum Role {
        OWNER, MEMBER
    }

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("userId") // Maps to the userId field in GroupMemberId
    @JoinColumn(name = "user_id")
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("groupId") // Maps to the groupId field in GroupMemberId
    @JoinColumn(name = "group_id")
    private Group group;

    @Column(name = "group_role", nullable = false, length = 20)
    private Role groupRole; // Can be upgraded to a Java Enum if preferred

    // --- Getters & Setters ---
    public GroupMemberId getId() { return id; }
    public void setId(GroupMemberId id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Group getGroup() { return group; }
    public void setGroup(Group group) { this.group = group; }
    public Role getGroupRole() { return groupRole; }
    public void setGroupRole(Role groupRole) { this.groupRole = groupRole; }
}
