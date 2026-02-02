package com.m2c.app.web.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class MediaToggleRequest {
    private Boolean audioEnabled;
    private Boolean videoEnabled;
}
