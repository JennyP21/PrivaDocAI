package com.jennypatel.privadocai.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jennypatel.privadocai.entity.Document;
import java.util.List;


@Repository
public interface DocumentRepo extends JpaRepository<Document, UUID> {
    List<Document> findByGroup_Id(UUID id);
}
