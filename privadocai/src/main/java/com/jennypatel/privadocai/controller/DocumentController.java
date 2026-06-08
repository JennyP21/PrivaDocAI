package com.jennypatel.privadocai.controller;

import java.util.List;
import java.util.UUID;

import com.jennypatel.privadocai.service.IngestionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.DocumentResponseDTO;
import com.jennypatel.privadocai.dto.DocumentStatusDTO;
import com.jennypatel.privadocai.service.DocumentService;


@RestController
@RequestMapping("/api/document")
public class DocumentController {

    final private DocumentService documentService;
    final private IngestionService ingestionService;

    public DocumentController(DocumentService documentService, IngestionService ingestionService){
        this.documentService = documentService;
        this.ingestionService = ingestionService;
    }

    @GetMapping("/group/{id}")
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> getDocumentsByGroupId(@PathVariable UUID id) {
        List<DocumentResponseDTO> documents = documentService.findAllDocumentsByGroupId(id);
        return ResponseEntity.ok(new ApiResponse<List<DocumentResponseDTO>>(true, "Success", documents));
    }

    @GetMapping("/group/{id}/statuses")
    public ResponseEntity<ApiResponse<List<DocumentStatusDTO>>> getDocumentStatuses(@PathVariable UUID id) {
        List<DocumentStatusDTO> statuses = documentService.findDocumentStatusesByGroupId(id);
        return ResponseEntity.ok(new ApiResponse<List<DocumentStatusDTO>>(true, "Success", statuses));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<DocumentResponseDTO>> getDocumentById(@PathVariable UUID id) {
        DocumentResponseDTO document = documentService.findDocumentById(id);
        return ResponseEntity.ok(new ApiResponse<DocumentResponseDTO>(true, "Success", document));
    }
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<List<DocumentResponseDTO>>> uploadDocuments(
            @RequestParam List<MultipartFile> files, 
            @RequestParam UUID groupId) {
        
        List<DocumentResponseDTO> response = documentService.uploadDocuments(files, groupId);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", response));
    }

    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<?>> deleteDocument(@PathVariable UUID id){
        documentService.deleteDocument(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success"));
    }

    @PostMapping("/ingest/{groupId}")
    public ResponseEntity<ApiResponse<?>> processDocuments(@PathVariable UUID groupId){
        ingestionService.processGroupDocuments(groupId);
        return ResponseEntity.accepted().body(new ApiResponse<>(true, "Success"));
    }

}
