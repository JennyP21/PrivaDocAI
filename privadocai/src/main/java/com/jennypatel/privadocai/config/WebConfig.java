package com.jennypatel.privadocai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.jennypatel.privadocai.security.AdminInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AdminInterceptor adminInterceptor;

    public WebConfig(AdminInterceptor adminInterceptor) {
        this.adminInterceptor = adminInterceptor;
    }

    @Override
    public void addInterceptors(@NonNull InterceptorRegistry registry) {
        // Register the middleware and tell it exactly which routes to protect
        registry.addInterceptor(adminInterceptor)
                .addPathPatterns(
                    "/api/group/create", 
                    "/api/group/delete/**",
                    "/api/group/isAvailable",
                    "/api/group/all",
                    "/api/admin/**"
                );
    }
}   