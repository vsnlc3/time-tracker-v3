package com.example.springbackend.tag;

public record TagResponse(Long id, String displayName, String color) {

    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getDisplayName(), tag.getColorKey());
    }
}
