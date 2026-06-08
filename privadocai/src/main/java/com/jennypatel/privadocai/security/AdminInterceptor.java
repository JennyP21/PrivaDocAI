package com.jennypatel.privadocai.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.repository.UserRepo;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;

@Component
public class AdminInterceptor implements HandlerInterceptor {
    private final UserRepo userRepo;

    public AdminInterceptor(UserRepo userRepo) {
        this.userRepo = userRepo;
    }

    @Override
    public boolean preHandle(@NonNull HttpServletRequest request,@NonNull HttpServletResponse response,@NonNull Object handler) throws Exception {
        
        // 1. Get the authenticated user's email from the Security Context (set by your JWT Filter)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        
        if (auth == null || !auth.isAuthenticated()) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("Unauthorized");
            return false; // Blocks the request
        }

        String email = auth.getName();

        // 2. Fetch the user and check the boolean
        User user = userRepo.findByEmail(email).orElse(null);

        if (user == null || !user.getIsSystemAdmin()) {
            // 3. If they aren't an admin, reject the request with a 403 Forbidden
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("Access Denied: System Administrator privileges required.");
            return false; // Blocks the request from reaching the Controller!
        }

        // 4. If they ARE an admin, let the request pass through to the Controller
        return true; 
    }
}
