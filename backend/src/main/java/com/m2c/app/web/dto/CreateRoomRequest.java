package com.m2c.app.web.dto;

import com.m2c.app.domain.room.RoomType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateRoomRequest {

    @NotBlank
    @Size(max = 120)
    private String name;

    @Size(max = 1024)
    private String description;

    private RoomType type = RoomType.PUBLIC;

    @Size(max = 120)
    private String password;
}
