package com.jennypatel.privadocai.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jennypatel.privadocai.entity.ChatSession;

@Repository
public interface ChatSessionRepo extends JpaRepository<ChatSession, UUID> {
    List<ChatSession> findByGroup_IdAndUser_IdOrderByCreatedAtDesc(UUID groupId, UUID userId);
}
