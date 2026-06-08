package com.jennypatel.privadocai.mapper;

import org.springframework.stereotype.Component;

import com.jennypatel.privadocai.dto.UserRequestDTO;
import com.jennypatel.privadocai.dto.UserResponseDTO;
import com.jennypatel.privadocai.entity.User;

@Component
public class UserMapper {
    public UserResponseDTO toDTO(User user){
        return new UserResponseDTO(user.getId(), user.getEmail(),  user.getIsSystemAdmin());
    }

    public User toEntity(UserRequestDTO userRequestDTO){
        User user = new User();
        user.setEmail(userRequestDTO.email());
        user.setPassword(userRequestDTO.password());
        return user;
    }
}
