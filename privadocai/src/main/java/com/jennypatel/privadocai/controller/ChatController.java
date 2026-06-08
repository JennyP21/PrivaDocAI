package com.jennypatel.privadocai.controller;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.ChatRequestDTO;
import com.jennypatel.privadocai.dto.ChatResponseDTO;
import com.jennypatel.privadocai.dto.ReferenceChunkDTO;
import com.jennypatel.privadocai.dto.ChatMessageResponseDTO;
import com.jennypatel.privadocai.dto.ChatSessionRequestDTO;
import com.jennypatel.privadocai.dto.ChatSessionResponseDTO;
import com.jennypatel.privadocai.entity.Document.DocumentStatus;
import com.jennypatel.privadocai.entity.ChatMessage;
import com.jennypatel.privadocai.entity.ChatSession;
import com.jennypatel.privadocai.entity.Group;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.repository.DocumentRepo;
import com.jennypatel.privadocai.repository.GroupRepo;
import com.jennypatel.privadocai.repository.ChatMessageRepo;
import com.jennypatel.privadocai.repository.ChatSessionRepo;
import com.jennypatel.privadocai.service.GroupMemberService;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.model.ChatResponse;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;
import reactor.util.function.Tuple2;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/chat")
public class ChatController {
    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final GroupMemberService groupMemberService;
    private final DocumentRepo documentRepo;
    private final GroupRepo groupRepo;
    private final ChatMessageRepo chatMessageRepo;
    private final ChatSessionRepo chatSessionRepo;

    public ChatController(VectorStore vectorStore, ChatClient chatClient, GroupMemberService groupMemberService, DocumentRepo documentRepo, GroupRepo groupRepo, ChatMessageRepo chatMessageRepo, ChatSessionRepo chatSessionRepo){
        this.vectorStore = vectorStore;
        this.chatClient = chatClient;
        this.groupMemberService = groupMemberService;
        this.documentRepo = documentRepo;
        this.groupRepo = groupRepo;
        this.chatMessageRepo = chatMessageRepo;
        this.chatSessionRepo = chatSessionRepo;
    }

    @PostMapping("/ask")
    public ResponseEntity<ApiResponse<ChatResponseDTO>> askQuestion(@RequestBody ChatRequestDTO chatRequestDTO){
        UUID sessionId = chatRequestDTO.sessionId();
        ChatSession session = chatSessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));

        UUID groupId = session.getGroup().getId();
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);

        User currentUser = groupMemberService.getCurrentAuthenticatedUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access Denied: You do not own this chat session.");
        }

        String question = chatRequestDTO.question();

        // Save User Message to database
        ChatMessage userMsg = new ChatMessage(session, currentUser, "user", question);
        chatMessageRepo.save(userMsg);

        // Fetch recent chat history (last 50 messages) and reverse to chronological order
        List<ChatMessage> history = chatMessageRepo.findTop6ByChatSession_IdOrderByCreatedAtDesc(sessionId);

        // Format history context for prompt and re-writing
        int MAX_HISTORY = 6;
        history = history.stream().skip(Math.max(0, history.size() - MAX_HISTORY)).toList();
        String finalHistory = history.stream().map(m -> m.getRole() + ": " + m.getContent()).collect(Collectors.joining("\n"));

        // Query Contextualization: Rewrite user's query if history exists
        String standaloneQuestion = question;
        if (!history.isEmpty()) {
            String rewritePrompt = """
                Given the following chat history and the latest user question, formulate a standalone question that can be understood without the chat history context. Do NOT answer the question, just reformulate it if needed, otherwise return the original question exactly.
                
                Chat History:
                {chat_history}
                
                Latest Question: {question}
                
                Standalone Question:
                """;

            try {
                String rewritten = chatClient.prompt()
                    .user(u -> u.text(rewritePrompt)
                        .param("chat_history", finalHistory)
                        .param("question", question))
                    .call()
                    .content();
                if (!rewritten.trim().isEmpty()) {
                    standaloneQuestion = rewritten.trim();
                }
            } catch (Exception e) {
                standaloneQuestion = question;
            }
        }

        // Check if there are any completed (vectorized) documents in the group
        List<com.jennypatel.privadocai.entity.Document> groupDocs = documentRepo.findByGroup_Id(groupId);
        boolean hasIngested = groupDocs.stream().anyMatch(d -> d.getStatus() == DocumentStatus.COMPLETED);

        if (!hasIngested) {
            ChatResponseDTO emptyResponse = new ChatResponseDTO(
                "No ingested documents found in this group. Please upload documents and run the ingestion pipeline under the Documents tab first.",
                new ArrayList<>()
            );

            ChatMessage aiWarningMsg = new ChatMessage(session, currentUser, "ai", emptyResponse.answer());
            chatMessageRepo.save(aiWarningMsg);

            return ResponseEntity.ok(new ApiResponse<>(true, "No context available", emptyResponse));
        }

        // Perform similarity search using the standalone question
        List<Document> similarDocuments = vectorStore.similaritySearch(
                SearchRequest.builder().query(standaloneQuestion)
                        .topK(5)
                        .filterExpression("groupId == '" + groupId + "'").build()
        );

        // Map retrieved documents to ReferenceChunkDTO using the "fileName" metadata
        List<ReferenceChunkDTO> references = similarDocuments.stream()
                .map(doc -> {
                    String fileName = (String) doc.getMetadata().getOrDefault("fileName", "Unknown File");
                    return new ReferenceChunkDTO(fileName, doc.getText());
                })
                .collect(Collectors.toList());

        String informationContext = similarDocuments.stream()
                .map(d -> """
                [SOURCE]
                %s
        
                %s
                """.formatted(
                        d.getMetadata().getOrDefault("fileName", "unknown"),
                        d.getFormattedContent()
                ))
                .collect(Collectors.joining("\n\n"));

        if (similarDocuments.isEmpty()) {
            ChatResponseDTO emptyResponse = new ChatResponseDTO("No matching chunks found.", new ArrayList<>());

            ChatMessage aiEmptyMsg = new ChatMessage(session, currentUser, "ai", emptyResponse.answer());
            chatMessageRepo.save(aiEmptyMsg);

            return ResponseEntity.ok(new ApiResponse<>(true, "No context", emptyResponse));
        }

        StringBuilder fullAnswer = new StringBuilder();

        // 1. Clean System Prompt (Only Rules, History, and Context)
        String systemPrompt = """
            You are PrivaDoc AI, a secure document assistant.
            
            You must follow these rules strictly:
            - Use ONLY the provided context and chat history.
            - If the answer is not explicitly found in the context, say: "I could not find this information in the provided documents."
            - Do NOT guess or use external knowledge.
            - Do NOT add explanations outside the context.
            - Do NOT start with filler words like "Sure" or "Okay".
            
            Answer directly and concisely.
            
            End every response with <END>.
            
            [CHAT HISTORY]
            {chat_history}
            
            [CONTEXT]
            {context}
            """;

        ChatResponse response = chatClient.prompt()
                .system(s -> s.text(systemPrompt)
                        .param("chat_history", finalHistory)
                        .param("context", informationContext))
                .user(standaloneQuestion)
                .call()
                .chatResponse();

        String answer = response.getResult() != null
                && response.getResult().getOutput() != null
                ? response.getResult().getOutput().getText()
                : "";

        ChatMessage aiResponseMsg =
                new ChatMessage(session, currentUser, "ai", answer);

        chatMessageRepo.save(aiResponseMsg);

        ChatResponseDTO chatResponse = new ChatResponseDTO(answer, references);

        return ResponseEntity.ok(new ApiResponse<>(true, "Success", chatResponse));
    }

    @GetMapping("/history/{sessionId}")
    public ResponseEntity<ApiResponse<List<ChatMessageResponseDTO>>> getChatHistory(@PathVariable UUID sessionId) {
        ChatSession session = chatSessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));

        UUID groupId = session.getGroup().getId();
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);

        User currentUser = groupMemberService.getCurrentAuthenticatedUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access Denied: You do not own this chat session.");
        }

        List<ChatMessage> history = chatMessageRepo.findTop6ByChatSession_IdOrderByCreatedAtDesc(sessionId);
        Collections.reverse(history);

        int MAX_HISTORY = 6;
        history = history.stream().skip(Math.max(0, history.size() - MAX_HISTORY)).toList();

        List<ChatMessageResponseDTO> dtos = history.stream()
            .map(msg -> new ChatMessageResponseDTO(msg.getRole(), msg.getContent()))
            .collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(true, "Chat history retrieved", dtos));
    }

    @GetMapping("/sessions/{groupId}")
    public ResponseEntity<ApiResponse<List<ChatSessionResponseDTO>>> getChatSessions(@PathVariable UUID groupId) {
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);
        User currentUser = groupMemberService.getCurrentAuthenticatedUser();

        List<ChatSession> sessions = chatSessionRepo.findByGroup_IdAndUser_IdOrderByCreatedAtDesc(groupId, currentUser.getId());

        List<ChatSessionResponseDTO> dtos = sessions.stream()
            .map(s -> new ChatSessionResponseDTO(s.getId(), s.getGroup().getId(), s.getTitle(), s.getCreatedAt()))
            .collect(Collectors.toList());

        return ResponseEntity.ok(new ApiResponse<>(true, "Chat sessions retrieved", dtos));
    }

    @PostMapping("/session")
    public ResponseEntity<ApiResponse<ChatSessionResponseDTO>> createChatSession(@RequestBody ChatSessionRequestDTO requestDTO) {
        UUID groupId = requestDTO.groupId();
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);

        Group group = groupRepo.findById(groupId)
            .orElseThrow(() -> new RuntimeException("Group not found"));
        User currentUser = groupMemberService.getCurrentAuthenticatedUser();

        ChatSession session = new ChatSession(group, currentUser, requestDTO.title());
        ChatSession saved = chatSessionRepo.save(session);

        ChatSessionResponseDTO responseDTO = new ChatSessionResponseDTO(saved.getId(), saved.getGroup().getId(), saved.getTitle(), saved.getCreatedAt());

        return ResponseEntity.ok(new ApiResponse<>(true, "Chat session created", responseDTO));
    }

    @DeleteMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<Void>> deleteChatSession(@PathVariable UUID sessionId) {
        ChatSession session = chatSessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));

        User currentUser = groupMemberService.getCurrentAuthenticatedUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access Denied: You do not own this chat session.");
        }

        chatSessionRepo.delete(session);
        return ResponseEntity.ok(new ApiResponse<>(true, "Chat session deleted", null));
    }

    @PutMapping("/session/{sessionId}")
    public ResponseEntity<ApiResponse<ChatSessionResponseDTO>> updateChatSession(
            @PathVariable UUID sessionId,
            @RequestBody ChatSessionRequestDTO requestDTO) {
        ChatSession session = chatSessionRepo.findById(sessionId)
            .orElseThrow(() -> new RuntimeException("Chat session not found"));

        User currentUser = groupMemberService.getCurrentAuthenticatedUser();
        if (!session.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Access Denied: You do not own this chat session.");
        }

        session.setTitle(requestDTO.title());
        ChatSession saved = chatSessionRepo.save(session);

        ChatSessionResponseDTO responseDTO = new ChatSessionResponseDTO(saved.getId(), saved.getGroup().getId(), saved.getTitle(), saved.getCreatedAt());
        return ResponseEntity.ok(new ApiResponse<>(true, "Chat session updated", responseDTO));
    }
}
