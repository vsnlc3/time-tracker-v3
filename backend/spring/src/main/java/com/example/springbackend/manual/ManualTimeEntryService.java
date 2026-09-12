package com.example.springbackend.manual;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.common.exception.BadRequestException;
import com.example.springbackend.common.exception.ResourceNotFoundException;
import com.example.springbackend.security.CurrentUserService;
import com.example.springbackend.tag.Tag;
import com.example.springbackend.tag.TagRepository;
import com.example.springbackend.user.User;

@Service
public class ManualTimeEntryService {

    private final ManualTimeEntryRepository entryRepository;
    private final TagRepository tagRepository;
    private final CurrentUserService currentUserService;

    public ManualTimeEntryService(
            ManualTimeEntryRepository entryRepository,
            TagRepository tagRepository,
            CurrentUserService currentUserService) {
        this.entryRepository = entryRepository;
        this.tagRepository = tagRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public List<ManualTimeEntryResponse> findByActivityDate(LocalDate activityDate) {
        User user = currentUserService.requireCurrentUser();
        var entries = activityDate == null
                ? entryRepository.findAllByTag_User_IdOrderById(user.getId())
                : entryRepository.findAllByActivityDateAndTag_User_IdOrderById(activityDate, user.getId());
        return entries
                .stream()
                .map(ManualTimeEntryResponse::from)
                .toList();
    }

    @Transactional
    public ManualTimeEntryResponse create(ManualTimeEntryRequest request) {
        User user = currentUserService.requireCurrentUser();
        Tag tag = findOwnedTag(request.tagId(), user.getId());
        validateBreakdown(request.totalSeconds(), request.focusSeconds(), request.breakSeconds());
        return ManualTimeEntryResponse.from(entryRepository.save(new ManualTimeEntry(
                tag,
                request.activityDate(),
                request.totalSeconds(),
                request.focusSeconds(),
                request.breakSeconds())));
    }

    @Transactional
    public ManualTimeEntryResponse update(Long entryId, ManualTimeEntryRequest request) {
        User user = currentUserService.requireCurrentUser();
        ManualTimeEntry entry = entryRepository.findByIdAndTag_User_Id(entryId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Manual time entry not found"));
        Tag tag = findOwnedTag(request.tagId(), user.getId());
        validateBreakdown(request.totalSeconds(), request.focusSeconds(), request.breakSeconds());
        entry.update(
                tag,
                request.activityDate(),
                request.totalSeconds(),
                request.focusSeconds(),
                request.breakSeconds());
        return ManualTimeEntryResponse.from(entry);
    }

    @Transactional
    public void delete(Long entryId) {
        User user = currentUserService.requireCurrentUser();
        ManualTimeEntry entry = entryRepository.findByIdAndTag_User_Id(entryId, user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Manual time entry not found"));
        entryRepository.delete(entry);
    }

    private Tag findOwnedTag(Long tagId, Long userId) {
        return tagRepository.findByIdAndUser_Id(tagId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
    }

    private void validateBreakdown(Long totalSeconds, Long focusSeconds, Long breakSeconds) {
        if (totalSeconds == null || totalSeconds < 1) {
            throw new BadRequestException("totalSeconds must be at least 1");
        }
        if (focusSeconds == null || focusSeconds < 0 || breakSeconds == null || breakSeconds < 0) {
            throw new BadRequestException("focusSeconds and breakSeconds must be non-negative");
        }
        if (totalSeconds != focusSeconds + breakSeconds) {
            throw new BadRequestException("totalSeconds must equal focusSeconds plus breakSeconds");
        }
    }
}
