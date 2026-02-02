package com.m2c.app.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AddScoreRequest {

    @NotNull
    @Min(1)
    private Integer problemNumber;
}
