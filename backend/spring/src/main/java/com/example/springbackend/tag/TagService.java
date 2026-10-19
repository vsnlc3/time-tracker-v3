package com.example.springbackend.tag;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.common.exception.BadRequestException;
import com.example.springbackend.common.exception.ConflictException;
import com.example.springbackend.common.exception.ResourceNotFoundException;
import com.example.springbackend.activity.ActivitySessionRepository;
import com.example.springbackend.manual.ManualTimeEntryRepository;
import com.example.springbackend.security.CurrentUserService;
import com.example.springbackend.user.User;

@Service
/** タグの所有者、重複、参照中データ、既定タグに関する業務ルールを扱います。 */
public class TagService {

    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;
    private final ActivitySessionRepository sessionRepository;
    private final ManualTimeEntryRepository manualTimeEntryRepository;

    public TagService(
            TagRepository tagRepository,
            CurrentUserService currentUserService,
            ActivitySessionRepository sessionRepository,
            ManualTimeEntryRepository manualTimeEntryRepository) {
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
        this.sessionRepository = sessionRepository;
        this.manualTimeEntryRepository = manualTimeEntryRepository;
    }

    @Transactional
    /** 利用者にタグがなければ既定タグを用意してから一覧を返します。 */
    public List<TagResponse> findAllForCurrentUser() {
        User user = currentUserService.requireCurrentUser();
        ensureDefaultTags(user);
        return tagRepository.findAllByUser_IdOrderById(user.getId()).stream()
                .map(TagResponse::from)
                .toList();
    }

    @Transactional
    /** 表示名と色を正規化し、利用者内で重複しないタグを作成します。 */
    public TagResponse create(TagRequest request) {
        User user = currentUserService.requireCurrentUser();
        String displayName = normalizedDisplayName(request);
        if (tagRepository.existsByUser_IdAndDisplayName(user.getId(), displayName)) {
            throw new BadRequestException("Tag display name already exists");
        }
        return TagResponse.from(tagRepository.save(new Tag(user, displayName, normalizeColor(request.color()))));
    }

    @Transactional
    /** 所有者と表示名の重複を確認し、タグを更新します。 */
    public TagResponse update(Long tagId, TagRequest request) {
        User user = currentUserService.requireCurrentUser();
        Tag tag = tagRepository.findByIdAndUser_Id(tagId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        String displayName = normalizedDisplayName(request);
        if (tagRepository.existsByUser_IdAndDisplayNameAndIdNot(
                user.getId(), displayName, tagId)) {
            throw new BadRequestException("Tag display name already exists");
        }
        tag.update(displayName, normalizeColor(request.color(), tag.getColorKey()));
        return TagResponse.from(tag);
    }

    @Transactional
    /** 参照中でないことと最後の1件でないことを確認して削除します。 */
    public void delete(Long tagId) {
        User user = currentUserService.requireCurrentUser();
        Tag tag = tagRepository.findByIdAndUser_Id(tagId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
        if (sessionRepository.existsByTag_Id(tagId) || manualTimeEntryRepository.existsByTag_Id(tagId)) {
            throw new ConflictException("Tag is used by existing records");
        }
        if (tagRepository.countByUser_Id(user.getId()) <= 1) {
            throw new BadRequestException("At least one tag is required");
        }
        tagRepository.delete(tag);
    }

    private String normalizedDisplayName(TagRequest request) {
        String displayName = request.displayName().trim();
        if (displayName.isEmpty()) {
            throw new BadRequestException("Tag display name must not be blank");
        }
        return displayName;
    }

    private String normalizeColor(String color) {
        return normalizeColor(color, "green");
    }

    private String normalizeColor(String color, String fallback) {
        if (color == null || color.isBlank()) return fallback;
        return switch (color) {
            case "green", "sky", "violet", "amber", "rose", "slate" -> color;
            default -> throw new BadRequestException("Unsupported tag color");
        };
    }

    private void ensureDefaultTags(User user) {
        if (tagRepository.countByUser_Id(user.getId()) > 0) return;
        // 初回の一覧取得時に最小限の分類を作り、画面が空の状態から始まらないようにします。
        tagRepository.saveAll(List.of(
                new Tag(user, "仕事", "green"),
                new Tag(user, "勉強", "sky"),
                new Tag(user, "瞑想", "violet"),
                new Tag(user, "余暇", "amber")));
    }
}
