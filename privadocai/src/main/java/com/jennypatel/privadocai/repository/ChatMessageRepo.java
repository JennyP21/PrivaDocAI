package com.jennypatel.privadocai.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jennypatel.privadocai.entity.ChatMessage;

@Repository
public interface ChatMessageRepo extends JpaRepository<ChatMessage, UUID> {
    
    // Find latest messages for a chat session, sorted by creation date descending to limit the count, then reversed in memory
    List<ChatMessage> findTop6ByChatSession_IdOrderByCreatedAtDesc(UUID sessionId);
}
