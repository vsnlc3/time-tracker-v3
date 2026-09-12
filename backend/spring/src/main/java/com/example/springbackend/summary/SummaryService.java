package com.example.springbackend.summary;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.activity.ActivitySessionRepository;
import com.example.springbackend.activity.ActivitySessionResponse;
import com.example.springbackend.activity.SegmentType;
import com.example.springbackend.activity.SessionSegmentRepository;
import com.example.springbackend.activity.SessionSegmentResponse;
import com.example.springbackend.manual.ManualTimeEntryRepository;
import com.example.springbackend.manual.ManualTimeEntryResponse;
import com.example.springbackend.security.CurrentUserService;
import com.example.springbackend.user.User;

@Service
public class SummaryService {

    private final ActivitySessionRepository sessionRepository;
    private final SessionSegmentRepository segmentRepository;
    private final ManualTimeEntryRepository entryRepository;
    private final CurrentUserService currentUserService;

    public SummaryService(
            ActivitySessionRepository sessionRepository,
            SessionSegmentRepository segmentRepository,
            ManualTimeEntryRepository entryRepository,
            CurrentUserService currentUserService) {
        this.sessionRepository = sessionRepository;
        this.segmentRepository = segmentRepository;
        this.entryRepository = entryRepository;
        this.currentUserService = currentUserService;
    }

    @Transactional(readOnly = true)
    public DailySummaryResponse find(LocalDate activityDate) {
        User user = currentUserService.requireCurrentUser();
        Instant now = Instant.now();
        List<ActivitySessionResponse> sessions = sessionRepository
                .findAllByActivityDateAndTag_User_IdOrderByStartedAtAsc(activityDate, user.getId())
                .stream()
                .map(session -> ActivitySessionResponse.from(
                        session,
                        segmentRepository.findAllByActivitySession_IdOrderByStartedAtAsc(session.getId()),
                        now))
                .toList();
        List<ManualTimeEntryResponse> entries = entryRepository
                .findAllByActivityDateAndTag_User_IdOrderById(activityDate, user.getId())
                .stream()
                .map(ManualTimeEntryResponse::from)
                .toList();

        Map<Long, TagAccumulator> byTag = new LinkedHashMap<>();
        long totalSeconds = 0;
        long focusSeconds = 0;
        long breakSeconds = 0;
        for (ActivitySessionResponse session : sessions) {
            TagAccumulator accumulator = byTag.computeIfAbsent(
                    session.tagId(), ignored -> new TagAccumulator(session.tagId(), session.tagDisplayName()));
            accumulator.totalSeconds += session.durationSeconds();
            totalSeconds += session.durationSeconds();
            for (SessionSegmentResponse segment : session.segments()) {
                if (segment.segmentType() == SegmentType.FOCUS) {
                    accumulator.focusSeconds += segment.durationSeconds();
                    focusSeconds += segment.durationSeconds();
                } else {
                    accumulator.breakSeconds += segment.durationSeconds();
                    breakSeconds += segment.durationSeconds();
                }
            }
        }
        for (ManualTimeEntryResponse entry : entries) {
            TagAccumulator accumulator = byTag.computeIfAbsent(
                    entry.tagId(), ignored -> new TagAccumulator(entry.tagId(), entry.tagDisplayName()));
            accumulator.totalSeconds += entry.totalSeconds();
            accumulator.focusSeconds += entry.focusSeconds();
            accumulator.breakSeconds += entry.breakSeconds();
            totalSeconds += entry.totalSeconds();
            focusSeconds += entry.focusSeconds();
            breakSeconds += entry.breakSeconds();
        }

        List<TagSummaryResponse> tagSummaries = new ArrayList<>();
        byTag.values().forEach(accumulator -> tagSummaries.add(accumulator.toResponse()));
        return new DailySummaryResponse(
                activityDate,
                totalSeconds,
                focusSeconds,
                breakSeconds,
                tagSummaries,
                sessions,
                entries);
    }

    private static final class TagAccumulator {
        private final Long tagId;
        private final String tagDisplayName;
        private long totalSeconds;
        private long focusSeconds;
        private long breakSeconds;

        private TagAccumulator(Long tagId, String tagDisplayName) {
            this.tagId = tagId;
            this.tagDisplayName = tagDisplayName;
        }

        private TagSummaryResponse toResponse() {
            return new TagSummaryResponse(
                    tagId,
                    tagDisplayName,
                    totalSeconds,
                    focusSeconds,
                    breakSeconds);
        }
    }
}
