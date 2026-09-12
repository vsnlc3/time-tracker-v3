package com.example.springbackend.activity;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.springbackend.common.exception.BadRequestException;
import com.example.springbackend.common.exception.ConflictException;
import com.example.springbackend.common.exception.ResourceNotFoundException;
import com.example.springbackend.security.CurrentUserService;
import com.example.springbackend.tag.Tag;
import com.example.springbackend.tag.TagRepository;
import com.example.springbackend.user.User;
import com.example.springbackend.user.UserRepository;

@Service
public class ActivitySessionService {

    private final ActivitySessionRepository sessionRepository;
    private final SessionSegmentRepository segmentRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final CurrentUserService currentUserService;
    private final TimedRangeResolver timedRangeResolver;

    public ActivitySessionService(
            ActivitySessionRepository sessionRepository,
            SessionSegmentRepository segmentRepository,
            TagRepository tagRepository,
            UserRepository userRepository,
            CurrentUserService currentUserService,
            TimedRangeResolver timedRangeResolver) {
        this.sessionRepository = sessionRepository;
        this.segmentRepository = segmentRepository;
        this.tagRepository = tagRepository;
        this.userRepository = userRepository;
        this.currentUserService = currentUserService;
        this.timedRangeResolver = timedRangeResolver;
    }

    @Transactional(readOnly = true)
    public List<ActivitySessionResponse> findByActivityDate(LocalDate activityDate) {
        User user = currentUserService.requireCurrentUser();
        Instant now = Instant.now();
        var sessions = activityDate == null
                ? sessionRepository.findAllByTag_User_IdOrderByStartedAtAsc(user.getId())
                : sessionRepository.findAllByActivityDateAndTag_User_IdOrderByStartedAtAsc(
                        activityDate, user.getId());
        return sessions
                .stream()
                .map(session -> toResponse(session, now))
                .toList();
    }

    @Transactional(readOnly = true)
    public ActivitySessionResponse findActive() {
        User user = currentUserService.requireCurrentUser();
        return sessionRepository.findFirstByTag_User_IdAndEndedAtIsNullOrderByStartedAtAsc(user.getId())
                .map(session -> toResponse(session, Instant.now()))
                .orElse(null);
    }

    @Transactional
    public ActivitySessionResponse start(StartActivitySessionRequest request) {
        User currentUser = lockCurrentUser();
        Tag tag = findOwnedTag(request.tagId(), currentUser.getId());

        Instant startedAt = Instant.now();
        validateSessionValues(
                startedAt,
                null,
                request.plannedDurationSeconds(),
                request.plannedEndAt());
        assertNoOverlap(currentUser.getId(), startedAt, null, null);

        ActivitySession session = sessionRepository.save(new ActivitySession(
                tag,
                request.activityDate(),
                startedAt,
                null,
                request.plannedDurationSeconds(),
                request.plannedEndAt()));
        SessionSegment segment = segmentRepository.save(new SessionSegment(
                session,
                request.initialSegmentType(),
                startedAt,
                null,
                request.segmentPlannedDurationSeconds()));
        return ActivitySessionResponse.from(session, List.of(segment), Instant.now());
    }

    @Transactional
    public ActivitySessionResponse createTimedManual(TimedManualSessionRequest request) {
        User currentUser = lockCurrentUser();
        Tag tag = findOwnedTag(request.tagId(), currentUser.getId());
        TimedRange range = timedRangeResolver.resolve(
                request.startedAt(), request.endedAt(), request.durationSeconds());
        assertNoOverlap(currentUser.getId(), range.startedAt(), range.endedAt(), null);

        ActivitySession session = sessionRepository.save(new ActivitySession(
                tag,
                request.activityDate(),
                range.startedAt(),
                range.endedAt(),
                null,
                null));
        SessionSegment segment = segmentRepository.save(new SessionSegment(
                session,
                request.segmentType(),
                range.startedAt(),
                range.endedAt(),
                null));
        return ActivitySessionResponse.from(session, List.of(segment), Instant.now());
    }

    @Transactional
    public ActivitySessionResponse finish(Long sessionId) {
        User currentUser = lockCurrentUser();
        ActivitySession session = findOwnedSession(sessionId, currentUser.getId());
        if (session.getEndedAt() != null) {
            throw new BadRequestException("Activity session is already finished");
        }

        Instant endedAt = Instant.now();
        List<SessionSegment> segments = findSegments(session);
        SessionSegment current = requireSingleOpenSegment(segments);
        session.finish(endedAt);
        current.end(endedAt);
        validateSegments(session, segments);
        return toResponse(session, endedAt);
    }

    @Transactional
    public ActivitySessionResponse switchSegment(Long sessionId, SegmentSwitchRequest request) {
        User currentUser = lockCurrentUser();
        ActivitySession session = findOwnedSession(sessionId, currentUser.getId());
        if (session.getEndedAt() != null) {
            throw new BadRequestException("Cannot switch a finished activity session");
        }

        List<SessionSegment> segments = findSegments(session);
        SessionSegment current = requireSingleOpenSegment(segments);
        if (current.getSegmentType() == request.segmentType()) {
            current.update(
                    current.getSegmentType(),
                    current.getStartedAt(),
                    current.getEndedAt(),
                    request.plannedDurationSeconds());
        } else {
            Instant switchedAt = Instant.now();
            current.end(switchedAt);
            segments.add(segmentRepository.save(new SessionSegment(
                    session,
                    request.segmentType(),
                    switchedAt,
                    null,
                    request.plannedDurationSeconds())));
        }
        validateSegments(session, segments);
        return toResponse(session, Instant.now());
    }

    @Transactional
    public ActivitySessionResponse update(Long sessionId, ActivitySessionUpdateRequest request) {
        User currentUser = lockCurrentUser();
        ActivitySession session = findOwnedSession(sessionId, currentUser.getId());
        Tag tag = findOwnedTag(request.tagId(), currentUser.getId());
        validateSessionValues(
                request.startedAt(),
                request.endedAt(),
                request.plannedDurationSeconds(),
                request.plannedEndAt());
        if (session.getEndedAt() != null && request.endedAt() == null) {
            throw new BadRequestException("A finished activity session cannot be reopened");
        }
        assertNoOverlap(currentUser.getId(), request.startedAt(), request.endedAt(), sessionId);

        List<SessionSegment> segments = findSegments(session);
        adjustSessionBoundarySegments(session, segments, request.startedAt(), request.endedAt());
        session.update(
                tag,
                request.activityDate(),
                request.startedAt(),
                request.endedAt(),
                request.plannedDurationSeconds(),
                request.plannedEndAt());
        validateSegments(session, segments);
        return toResponse(session, Instant.now());
    }

    @Transactional
    public void delete(Long sessionId) {
        User currentUser = lockCurrentUser();
        ActivitySession session = findOwnedSession(sessionId, currentUser.getId());
        sessionRepository.delete(session);
    }

    @Transactional
    public SessionSegmentResponse updateSegment(Long segmentId, SessionSegmentUpdateRequest request) {
        User currentUser = lockCurrentUser();
        SessionSegment segment = findOwnedSegment(segmentId, currentUser.getId());
        ActivitySession session = segment.getActivitySession();
        List<SessionSegment> segments = findSegments(session);
        segments.sort(Comparator.comparing(SessionSegment::getStartedAt));
        int index = indexOfSegment(segments, segmentId);
        boolean first = index == 0;
        boolean last = index == segments.size() - 1;

        // Every segment except the last one must have a boundary for the next
        // segment. Without this guard, a null value would be propagated to the
        // next segment and fail later with a NullPointerException during sort.
        if (!last && request.endedAt() == null) {
            throw new BadRequestException("A non-final segment must have an end time");
        }
        if (session.getEndedAt() != null && last && request.endedAt() == null) {
            throw new BadRequestException("A finished activity session cannot be reopened");
        }

        Instant newSessionStart = first ? request.startedAt() : session.getStartedAt();
        Instant newSessionEnd = last ? request.endedAt() : session.getEndedAt();
        validateSessionValues(
                newSessionStart,
                newSessionEnd,
                session.getPlannedDurationSeconds(),
                session.getPlannedEndAt());
        assertNoOverlap(currentUser.getId(), newSessionStart, newSessionEnd, session.getId());

        segment.update(
                request.segmentType(),
                request.startedAt(),
                request.endedAt(),
                request.plannedDurationSeconds());

        if (first) {
            session.update(
                    session.getTag(),
                    session.getActivityDate(),
                    newSessionStart,
                    newSessionEnd,
                    session.getPlannedDurationSeconds(),
                    session.getPlannedEndAt());
        } else {
            segments.get(index - 1).end(request.startedAt());
        }
        if (!last) {
            segments.get(index + 1).startAt(request.endedAt());
        } else if (!first) {
            session.update(
                    session.getTag(),
                    session.getActivityDate(),
                    session.getStartedAt(),
                    newSessionEnd,
                    session.getPlannedDurationSeconds(),
                    session.getPlannedEndAt());
        }
        validateSegments(session, segments);
        return SessionSegmentResponse.from(segment, Instant.now());
    }

    @Transactional
    public void deleteSegment(Long segmentId) {
        User currentUser = lockCurrentUser();
        SessionSegment segment = findOwnedSegment(segmentId, currentUser.getId());
        ActivitySession session = segment.getActivitySession();
        List<SessionSegment> segments = new ArrayList<>(findSegments(session));
        if (segments.size() == 1) {
            throw new BadRequestException("An activity session must keep at least one segment");
        }

        segments.sort(Comparator.comparing(SessionSegment::getStartedAt));
        int index = indexOfSegment(segments, segmentId);
        if (index > 0) {
            segments.get(index - 1).end(segment.getEndedAt());
        } else {
            segments.get(1).startAt(segment.getStartedAt());
        }
        segmentRepository.delete(segment);
        segments.remove(index);
        validateSegments(session, segments);
    }

    private ActivitySessionResponse toResponse(ActivitySession session, Instant now) {
        return ActivitySessionResponse.from(session, findSegments(session), now);
    }

    private User lockCurrentUser() {
        User currentUser = currentUserService.requireCurrentUser();
        return userRepository.findByIdForUpdate(currentUser.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private Tag findOwnedTag(Long tagId, Long userId) {
        return tagRepository.findByIdAndUser_Id(tagId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found"));
    }

    private ActivitySession findOwnedSession(Long sessionId, Long userId) {
        return sessionRepository.findByIdAndTag_User_Id(sessionId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Activity session not found"));
    }

    private SessionSegment findOwnedSegment(Long segmentId, Long userId) {
        return segmentRepository.findByIdAndActivitySession_Tag_User_Id(segmentId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Session segment not found"));
    }

    private List<SessionSegment> findSegments(ActivitySession session) {
        return new ArrayList<>(segmentRepository.findAllByActivitySession_IdOrderByStartedAtAsc(session.getId()));
    }

    private void assertNoOverlap(Long userId, Instant startedAt, Instant endedAt, Long excludedSessionId) {
        boolean overlaps = sessionRepository.findAllByTag_User_IdOrderByStartedAtAsc(userId).stream()
                .filter(session -> !session.getId().equals(excludedSessionId))
                .anyMatch(session -> overlaps(
                        startedAt,
                        endedAt,
                        session.getStartedAt(),
                        session.getEndedAt()));
        if (overlaps) {
            throw new ConflictException("Activity session time overlaps another session");
        }
    }

    private boolean overlaps(Instant leftStart, Instant leftEnd, Instant rightStart, Instant rightEnd) {
        boolean leftBeforeRightEnd = rightEnd == null || leftStart.isBefore(rightEnd);
        boolean rightBeforeLeftEnd = leftEnd == null || rightStart.isBefore(leftEnd);
        return leftBeforeRightEnd && rightBeforeLeftEnd;
    }

    private SessionSegment requireSingleOpenSegment(List<SessionSegment> segments) {
        List<SessionSegment> openSegments = segments.stream()
                .filter(segment -> segment.getEndedAt() == null)
                .toList();
        if (openSegments.size() != 1) {
            throw new BadRequestException("Activity session must have exactly one open segment");
        }
        return openSegments.get(0);
    }

    private void adjustSessionBoundarySegments(
            ActivitySession session,
            List<SessionSegment> segments,
            Instant newStartedAt,
            Instant newEndedAt) {
        if (segments.isEmpty()) {
            throw new BadRequestException("Activity session must have at least one segment");
        }
        segments.sort(Comparator.comparing(SessionSegment::getStartedAt));
        SessionSegment first = segments.get(0);
        SessionSegment last = segments.get(segments.size() - 1);
        if (!first.getStartedAt().equals(session.getStartedAt())) {
            throw new BadRequestException("Existing segments do not cover the session start");
        }
        if (session.getEndedAt() == null) {
            if (last.getEndedAt() != null) {
                throw new BadRequestException("Existing segments do not cover the active session");
            }
        } else if (!session.getEndedAt().equals(last.getEndedAt())) {
            throw new BadRequestException("Existing segments do not cover the session end");
        }
        first.startAt(newStartedAt);
        last.end(newEndedAt);
    }

    private void validateSessionValues(
            Instant startedAt,
            Instant endedAt,
            Long plannedDurationSeconds,
            Instant plannedEndAt) {
        if (endedAt != null && !endedAt.isAfter(startedAt)) {
            throw new BadRequestException("endedAt must be after startedAt");
        }
        validatePlan(plannedDurationSeconds, plannedEndAt);
        if (plannedEndAt != null && !plannedEndAt.isAfter(startedAt)) {
            throw new BadRequestException("plannedEndAt must be after startedAt");
        }
    }

    private void validatePlan(Long plannedDurationSeconds, Instant plannedEndAt) {
        if (plannedDurationSeconds != null && plannedDurationSeconds < 1) {
            throw new BadRequestException("plannedDurationSeconds must be at least 1");
        }
        if (plannedDurationSeconds != null && plannedEndAt != null) {
            throw new BadRequestException("planned duration and planned end cannot both be set");
        }
    }

    private void validateSegments(ActivitySession session, List<SessionSegment> segments) {
        if (segments.isEmpty()) {
            throw new BadRequestException("Activity session must have at least one segment");
        }
        segments.sort(Comparator.comparing(SessionSegment::getStartedAt));
        SessionSegment first = segments.get(0);
        if (!first.getStartedAt().equals(session.getStartedAt())) {
            throw new BadRequestException("Segments must start with the activity session");
        }

        Instant previousEnd = null;
        for (int index = 0; index < segments.size(); index++) {
            SessionSegment segment = segments.get(index);
            if (segment.getEndedAt() != null && !segment.getEndedAt().isAfter(segment.getStartedAt())) {
                throw new BadRequestException("Segment end must be after its start");
            }
            if (previousEnd != null && !segment.getStartedAt().equals(previousEnd)) {
                throw new BadRequestException("Segments must not contain gaps or overlaps");
            }
            if (index < segments.size() - 1 && segment.getEndedAt() == null) {
                throw new BadRequestException("Only the last segment may be active");
            }
            if (segment.getStartedAt().isBefore(session.getStartedAt())) {
                throw new BadRequestException("Segment must be inside its activity session");
            }
            if (session.getEndedAt() != null
                    && (segment.getEndedAt() == null || segment.getEndedAt().isAfter(session.getEndedAt()))) {
                throw new BadRequestException("Segment must be inside its activity session");
            }
            previousEnd = segment.getEndedAt();
        }

        SessionSegment last = segments.get(segments.size() - 1);
        if (session.getEndedAt() == null) {
            if (last.getEndedAt() != null) {
                throw new BadRequestException("Active session must have an active last segment");
            }
        } else if (!session.getEndedAt().equals(last.getEndedAt())) {
            throw new BadRequestException("Segments must cover the activity session end");
        }
    }

    private int indexOfSegment(List<SessionSegment> segments, Long segmentId) {
        for (int index = 0; index < segments.size(); index++) {
            if (segments.get(index).getId().equals(segmentId)) {
                return index;
            }
        }
        throw new ResourceNotFoundException("Session segment not found");
    }
}
