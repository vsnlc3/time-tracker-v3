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
/** 活動タグの一覧・作成・更新・削除 API を提供します。 */
public class TagController {

    private final TagService tagService;

    public TagController(TagService tagService) {
        this.tagService = tagService;
    }

    @GetMapping
    /** ログイン利用者のタグを返します。 */
    public List<TagResponse> findAll() {
        return tagService.findAllForCurrentUser();
    }

    @PostMapping
    /** タグを作成し、作成した値を HTTP 201 で返します。 */
    public ResponseEntity<TagResponse> create(@Valid @RequestBody TagRequest request) {
        return ResponseEntity.status(201).body(tagService.create(request));
    }

    @PutMapping("/{tagId}")
    /** タグの表示名または色を更新します。 */
    public TagResponse update(
            @PathVariable @Positive Long tagId,
            @Valid @RequestBody TagRequest request) {
        return tagService.update(tagId, request);
    }

    @DeleteMapping("/{tagId}")
    /** 利用状況などを検証したうえでタグを削除します。 */
    public ResponseEntity<Void> delete(@PathVariable @Positive Long tagId) {
        tagService.delete(tagId);
        return ResponseEntity.noContent().build();
    }
}
