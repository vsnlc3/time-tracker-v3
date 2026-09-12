package com.example.springbackend.tag;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Positive;

@Validated
@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    public List<TagResponse> findAll() {
        return tagService.findAllForCurrentUser();
    }

    @PostMapping
    public ResponseEntity<TagResponse> create(@Valid @RequestBody TagRequest request) {
        return ResponseEntity.status(201).body(tagService.create(request));
    }

    @PutMapping("/{tagId}")
    public TagResponse update(
            @PathVariable @Positive Long tagId,
            @Valid @RequestBody TagRequest request) {
        return tagService.update(tagId, request);
    }

    @DeleteMapping("/{tagId}")
    public ResponseEntity<Void> delete(@PathVariable @Positive Long tagId) {
        tagService.delete(tagId);
        return ResponseEntity.noContent().build();
    }
}
