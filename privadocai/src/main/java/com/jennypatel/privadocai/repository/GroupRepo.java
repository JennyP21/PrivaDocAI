package com.jennypatel.privadocai.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.jennypatel.privadocai.entity.Group;

@Repository
public interface GroupRepo extends JpaRepository<Group, UUID> {
    Optional<Group> findByName(String name);
}
