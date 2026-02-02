package com.m2c.app.web.dto;

import jakarta.validation.constraints.NotBlank;

public record WhiteboardUpdateRequest(@NotBlank String imageData) {
}
