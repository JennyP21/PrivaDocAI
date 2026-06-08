package com.jennypatel.privadocai.controller;

import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.jennypatel.privadocai.dto.ApiResponse;
import com.jennypatel.privadocai.dto.UserRequestDTO;
import com.jennypatel.privadocai.dto.UserResponseDTO;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.repository.UserRepo;
import com.jennypatel.privadocai.service.UserService;

@RestController
@RequestMapping("/api/user")
public class UserController {
    
    private final UserService userService;
    private final UserRepo userRepo;

    public UserController(UserService userService, UserRepo userRepo){
        this.userService = userService;
        this.userRepo = userRepo;
    }

    // get user by id
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getUserById(@PathVariable @NonNull UUID id){
        UserResponseDTO user = userService.getById(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", user));
    }

    // get user by email
    @GetMapping("/email/{email:.+}")
    public ResponseEntity<ApiResponse<UserResponseDTO>> getUserByEmail(@PathVariable String email){
        UserResponseDTO user = userService.getByEmail(email);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", user));
    }

    // register user
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<UserResponseDTO>> registerUser(@RequestBody UserRequestDTO user){
        UserResponseDTO newUser = userService.create(user);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success", newUser));
    }

    // delete user
    @DeleteMapping("/delete/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable @NonNull UUID id){
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String email = auth.getName();
        User currentUser = userRepo.findByEmail(email)
                .orElseThrow(() -> new AccessDeniedException("Access Denied: Current user not found"));

        if (!currentUser.getId().equals(id) && !currentUser.getIsSystemAdmin()) {
            throw new AccessDeniedException("Access Denied: You do not have permission to delete this account");
        }

        userService.delete(id);
        return ResponseEntity.ok(new ApiResponse<>(true, "Success"));
    }
}