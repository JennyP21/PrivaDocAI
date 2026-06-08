package com.jennypatel.privadocai.service;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class ChatService {

    private final ChatClient chatClient;

    public ChatService(ChatClient.Builder chatClientBuilder) {
        this.chatClient = chatClientBuilder.build();
    }

    public Flux<String> streamAnswer(String question, String informationContext) {
        return this.chatClient.prompt()
                .system(s -> s.text("You are a helpful assistant. Use the following context: {context}")
                        .param("context", informationContext))
                .user(question)
                // This is the magic swap:
                .stream()
                .content();
    }
}