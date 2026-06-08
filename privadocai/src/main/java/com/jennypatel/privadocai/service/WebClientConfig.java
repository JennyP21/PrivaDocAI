package com.jennypatel.privadocai.service;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfig {
    
    @Bean
    public WebClient unstructuredWebClient() {
        // This creates a reusable client pointing directly at your Unstructured Docker API
        return WebClient.builder()
                .baseUrl("http://localhost:8001/general/v0/general") 
                .build();
    }
}
