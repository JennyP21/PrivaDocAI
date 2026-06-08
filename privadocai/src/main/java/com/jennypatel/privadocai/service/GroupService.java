package com.jennypatel.privadocai.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.jennypatel.privadocai.dto.GroupRequestDTO;
import com.jennypatel.privadocai.dto.GroupResponseDTO;
import com.jennypatel.privadocai.entity.Document;
import com.jennypatel.privadocai.entity.Group;
import com.jennypatel.privadocai.mapper.GroupMapper;
import com.jennypatel.privadocai.repository.DocumentRepo;
import com.jennypatel.privadocai.repository.GroupRepo;

@Service
public class GroupService {
    private final GroupRepo groupRepo;
    private final GroupMapper groupMapper;
    private final DocumentRepo documentRepo;
    private final JdbcTemplate jdbcTemplate;

    public GroupService(GroupRepo groupRepo, GroupMapper groupMapper, DocumentRepo documentRepo, JdbcTemplate jdbcTemplate){
        this.groupRepo = groupRepo;
        this.groupMapper = groupMapper;
        this.documentRepo = documentRepo;
        this.jdbcTemplate = jdbcTemplate;
    }

    public boolean isGroupNameAvailable(String groupName) {
        return groupRepo.findByName(groupName).isEmpty();
    }

    public GroupResponseDTO createGroup(GroupRequestDTO groupRequestDTO){
        if (!isGroupNameAvailable(groupRequestDTO.name())) {
            throw new RuntimeException("A group with this name already exists.");
        }
        
        Group newGroup = groupMapper.toEntity(groupRequestDTO);
        Group savedGroup = groupRepo.save(newGroup);

        return groupMapper.toDTO(savedGroup);
    }

    @Transactional
    public void deleteGroup(@NonNull UUID id){
        if (!groupRepo.existsById(id)) {
            throw new RuntimeException("Group not found.");
        }
        
        // 1. Get all documents in the group
        List<Document> documents = documentRepo.findByGroup_Id(id);
        
        // 2. Delete physical files from disk
        for (Document doc : documents) {
            try {
                Files.deleteIfExists(Paths.get(doc.getFilePath()));
            } catch (IOException e) {
                System.err.println("Warning: Failed to delete physical file on group delete: " + doc.getFilePath() + " - " + e.getMessage());
            }
        }

        // 3. Delete all vector store embeddings for this group
        jdbcTemplate.update("DELETE FROM vector_store WHERE metadata->>'groupId' = ?", id.toString());

        // 4. Delete group from database (cascade deletes members, documents, sessions metadata)
        groupRepo.deleteById(id);
    }

    public List<GroupResponseDTO> getAllGroups() {
        return groupRepo.findAll().stream()
                .map(groupMapper::toDTO)
                .collect(Collectors.toList());
    }
}