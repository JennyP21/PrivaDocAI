package com.jennypatel.privadocai.service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import com.jennypatel.privadocai.entity.Document;
import com.jennypatel.privadocai.entity.Document.DocumentStatus;
import com.jennypatel.privadocai.repository.DocumentRepo;


@Service
public class IngestionService {

    private final WebClient unstructuredWebClient;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final DocumentRepo documentRepo;
    private final VectorStore vectorStore;
    record DocElement(String type, String text, int size) {}

    public IngestionService(DocumentRepo documentRepo, WebClient unstructuredWebClient, VectorStore vectorStore) {
        this.documentRepo = documentRepo;
        this.unstructuredWebClient = unstructuredWebClient;
        this.vectorStore = vectorStore;
    }

    private String parseDocumentWithUnstructured(String filePath) {
        // 1. Grab the physical file from the disk
        FileSystemResource fileResource = new FileSystemResource(filePath);

        // 2. Build a multipart form request (like an HTML form)
        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("files", fileResource);
        body.add("strategy", "hi_res"); // Use high-resolution strategy for tables/images

        try {
            return unstructuredWebClient.post()
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body))
                    .retrieve()
                    .bodyToMono(String.class)
                    .block();

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse document with Unstructured API", e);
        }
    }

    private List<DocElement> extractElements(String jsonResponse) {
        try {
            JsonNode elements = objectMapper.readTree(jsonResponse);

            List<DocElement> result = new ArrayList<>();

            for (JsonNode element : elements) {
                String type = element.has("type") ? element.get("type").asText() : "Unknown";
                String text = element.has("text") ? element.get("text").asText() : "";

                if (!text.isBlank()) {
                    result.add(new DocElement(type, text, result.size()));
                }
            }

            return result;

        } catch (Exception e) {
            throw new RuntimeException("Failed to parse Unstructured JSON", e);
        }
    }

    private List<org.springframework.ai.document.Document> buildStructuredChunks(List<DocElement> elements) {

        List<org.springframework.ai.document.Document> chunks = new ArrayList<>();

        String currentSection = "General";
        StringBuilder buffer = new StringBuilder();

        for (DocElement el : elements) {

            if (el.type().equalsIgnoreCase("Title")) {
                // flush previous section
                if (!buffer.isEmpty()) {
                    chunks.add(createChunk(currentSection, buffer.toString()));
                    buffer.setLength(0);
                }

                currentSection = el.text();
            } else {
                buffer.append(el.text()).append("\n");
            }
        }

        // flush last
        if (!buffer.isEmpty()) {
            chunks.add(createChunk(currentSection, buffer.toString()));
        }

        return chunks;
    }

    private org.springframework.ai.document.Document createChunk(String section, String text) {

        org.springframework.ai.document.Document doc =
                new org.springframework.ai.document.Document(text);

        doc.getMetadata().put("sectionTitle", section);
        doc.getMetadata().put("chunkType", "structured-section");

        return doc;
    }

    @Async
    public void processGroupDocuments(UUID groupId) {
        List<Document> documents = documentRepo.findByGroup_Id(groupId);
        for (Document doc : documents) {
            if (doc.getStatus() == DocumentStatus.COMPLETED) {
                continue; 
            }

            try {
                doc.setStatus(DocumentStatus.PROCESSING);
                documentRepo.save(doc);
                
                // --- THE RAG STEPS GO HERE FOR THIS SPECIFIC DOC ---
                // Step 1: Unstructured API
                String rawUnstructuredJson = parseDocumentWithUnstructured(doc.getFilePath());
                List<DocElement> elements = extractElements(rawUnstructuredJson);

                // Step 2: Chunking
                List<org.springframework.ai.document.Document> chunks = buildStructuredChunks(elements);

                // Step 3: Populate Metadata
                int index = 0;
                for (org.springframework.ai.document.Document chunk : chunks) {
                    String sectionTitle =
                            (String) chunk.getMetadata().getOrDefault("sectionTitle", "Unknown");

                    String sectionId = groupId + ":" + sectionTitle;

                    chunk.getMetadata().put("documentId", doc.getId().toString());
                    chunk.getMetadata().put("groupId", groupId.toString());
                    chunk.getMetadata().put("fileName", doc.getOriginalFileName());

                    chunk.getMetadata().put("sectionTitle", sectionTitle);
                    chunk.getMetadata().put("sectionId", sectionId);
                    chunk.getMetadata().put("chunkIndex", index++);
                }

                // Step 4: Embeddings & Step 5: Save to pgvector
                vectorStore.add(chunks);
                // -----------------------------------------------------
                doc.setStatus(DocumentStatus.COMPLETED);
                documentRepo.save(doc);

            } catch (Exception e) {
                doc.setStatus(DocumentStatus.FAILED);
                documentRepo.save(doc);
            }
        }        
    }
}