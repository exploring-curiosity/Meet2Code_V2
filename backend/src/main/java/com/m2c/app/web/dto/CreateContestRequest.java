package com.m2c.app.web.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.List;

@Getter
@Setter
public class CreateContestRequest {

    @NotBlank
    @Size(max = 80)
    private String name;

    @Future
    private OffsetDateTime startTime;

    @NotEmpty
    private List<String> questions;
}
