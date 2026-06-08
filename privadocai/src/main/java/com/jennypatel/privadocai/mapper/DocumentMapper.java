package com.jennypatel.privadocai.mapper;

import org.springframework.stereotype.Component;

import com.jennypatel.privadocai.dto.DocumentResponseDTO;
import com.jennypatel.privadocai.entity.Document;

@Component
public class DocumentMapper {
    public DocumentResponseDTO toDTO(Document document){
        return new DocumentResponseDTO(document.getId(), document.getOriginalFileName(), document.getMimeType(), document.getStatus(), document.getGroup().getId(), document.getUploadedBy().getId(), document.getUploadedAt());
    }
}
