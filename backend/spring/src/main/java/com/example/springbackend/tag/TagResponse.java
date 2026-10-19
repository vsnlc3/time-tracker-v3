package com.example.springbackend.tag;

/** タグの API 応答です。内部フィールド名 colorKey は公開名 color に対応します。 */
public record TagResponse(Long id, String displayName, String color) {

    /** エンティティから API 応答を作成します。 */
    public static TagResponse from(Tag tag) {
        return new TagResponse(tag.getId(), tag.getDisplayName(), tag.getColorKey());
    }
}
