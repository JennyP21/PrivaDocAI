package com.jennypatel.privadocai.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.jennypatel.privadocai.dto.DocumentResponseDTO;
import com.jennypatel.privadocai.dto.DocumentStatusDTO;
import com.jennypatel.privadocai.entity.Document;
import com.jennypatel.privadocai.entity.Document.DocumentStatus;
import com.jennypatel.privadocai.entity.Group;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.mapper.DocumentMapper;
import com.jennypatel.privadocai.repository.DocumentRepo;
import com.jennypatel.privadocai.repository.GroupRepo;
import com.jennypatel.privadocai.repository.UserRepo;

import jakarta.transaction.Transactional;

@Service
public class DocumentService {
    private DocumentRepo documentRepo;
    private GroupRepo groupRepo;
    private UserRepo userRepo;
    private DocumentMapper documentMapper;
    private GroupMemberService groupMemberService;
    private final JdbcTemplate jdbcTemplate;
    private final Path fileStorageLocation;

    public DocumentService(
        DocumentRepo documentRepo,
        GroupRepo groupRepo,
        UserRepo userRepo,
        @Value("${app.storage.upload-dir}") String uploadDir,
        DocumentMapper documentMapper,
        GroupMemberService groupMemberService,
        JdbcTemplate jdbcTemplate
    ){
        this.documentRepo = documentRepo;
        this.groupRepo = groupRepo;
        this.userRepo = userRepo;
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.documentMapper = documentMapper;
        this.groupMemberService = groupMemberService;
        this.jdbcTemplate = jdbcTemplate;
    }

    private static final List<String> ALLOWED_MIME_TYPES = Arrays.asList(
            "application/pdf", 
            "text/plain", 
            "application/msword", // .doc
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" // .docx
    );

    public List<DocumentResponseDTO> findAllDocumentsByGroupId(UUID groupId){
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);
        return documentRepo.findByGroup_Id(groupId).stream().map(documentMapper::toDTO).collect(Collectors.toList());
    }

    public DocumentResponseDTO findDocumentById(UUID id){
        Document doc = documentRepo.findById(id).orElseThrow(() -> new RuntimeException("Document not found"));
        groupMemberService.verifyGroupMemberOrSystemAdmin(doc.getGroup().getId());
        return documentMapper.toDTO(doc);
    }

    @Transactional
    public List<DocumentResponseDTO> uploadDocuments(List<MultipartFile> files, UUID groupId){
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepo.findByEmail(email).orElseThrow(() -> new RuntimeException("User not found"));
        
        Group group = groupRepo.findById(groupId).orElseThrow(() -> new RuntimeException("Group not found"));

        List<Document> savedDocuments = new java.util.ArrayList<>();

        for (MultipartFile file : files) {

            if (file.isEmpty() || !ALLOWED_MIME_TYPES.contains(file.getContentType())) {
                throw new RuntimeException("Invalid file: " + file.getOriginalFilename() + ". Only PDF, TXT, and Word are allowed.");
            }

            try {
                String originalFileName = file.getOriginalFilename();
                String storedFileName = UUID.randomUUID().toString() + "_" + originalFileName;
                Path targetLocation = this.fileStorageLocation.resolve(storedFileName);

                Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

                Document document = new Document();
                document.setOriginalFileName(file.getOriginalFilename());
                document.setStoredFileName(storedFileName);
                document.setFilePath(targetLocation.toString());
                document.setMimeType(file.getContentType());
                document.setGroup(group);
                document.setUploadedBy(currentUser);
                document.setStatus(DocumentStatus.UPLOADED);
                
                savedDocuments.add(documentRepo.save(document));
            } catch (IOException ex) {
                throw new RuntimeException("Failed to store file: " + file.getOriginalFilename(), ex);
            }
        }
        return savedDocuments.stream().map(documentMapper::toDTO).collect(Collectors.toList());
    }


    @Transactional
    public void deleteDocument(UUID documentId){
        Document doc = documentRepo.findById(documentId).orElseThrow(() -> new RuntimeException("Document not found"));
        groupMemberService.verifyGroupMemberOrSystemAdmin(doc.getGroup().getId());
        
        // 1. Delete physical file from disk
        try {
            Files.deleteIfExists(Paths.get(doc.getFilePath()));
        } catch (IOException e) {
            System.err.println("Warning: Failed to delete physical file: " + doc.getFilePath() + " - " + e.getMessage());
        }

        // 2. Delete vectors from pgvector table
        jdbcTemplate.update("DELETE FROM vector_store WHERE metadata->>'documentId' = ?", documentId.toString());

        // 3. Delete metadata from database
        documentRepo.delete(doc);
    }

    public List<DocumentStatusDTO> findDocumentStatusesByGroupId(UUID groupId){
        groupMemberService.verifyGroupMemberOrSystemAdmin(groupId);
        return documentRepo.findByGroup_Id(groupId).stream()
                .map(doc -> new DocumentStatusDTO(doc.getId(), doc.getStatus().name()))
                .collect(Collectors.toList());
    }
}
