package com.jennypatel.privadocai.service;

import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.lang.NonNull;
import com.jennypatel.privadocai.dto.UserRequestDTO;
import com.jennypatel.privadocai.dto.UserResponseDTO;
import com.jennypatel.privadocai.entity.User;
import com.jennypatel.privadocai.mapper.UserMapper;
import com.jennypatel.privadocai.repository.UserRepo;

@Service
public class UserService {

    private final UserRepo userRepo;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepo userRepo, UserMapper userMapper, PasswordEncoder passwordEncoder){
        this.userRepo = userRepo;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponseDTO create(UserRequestDTO userRequestDTO){
        if (userRepo.findByEmail(userRequestDTO.email()).isPresent()) {
            throw new RuntimeException("An account with this email is already registered");
        }
        User newUser = userMapper.toEntity(userRequestDTO);
        String hashed = passwordEncoder.encode(newUser.getPassword());
        newUser.setPassword(hashed);
        User saved = userRepo.save(newUser);
        return userMapper.toDTO(saved);
    }

    public UserResponseDTO getById(@NonNull UUID id) throws RuntimeException{
        return userRepo.findById(id).map(userMapper::toDTO).orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public UserResponseDTO getByEmail(String email){
        return userRepo.findByEmail(email).map(userMapper::toDTO).orElseThrow(() -> new RuntimeException("Account not found"));
    }

    public void delete(@NonNull UUID id){
        userRepo.deleteById(id);
    }
    
}
