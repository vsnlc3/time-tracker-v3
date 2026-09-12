package com.example.springbackend;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.time.LocalDate;

import jakarta.servlet.http.Cookie;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class MvpApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private String subject;

    @BeforeEach
    void setUp() {
        subject = "integration-" + UUID.randomUUID();
    }

    @AfterEach
    void tearDown() {
        jdbcTemplate.update("DELETE FROM session_segments WHERE activity_session_id IN "
                + "(SELECT id FROM activity_sessions WHERE tag_id IN "
                + "(SELECT id FROM tags WHERE user_id IN "
                + "(SELECT id FROM users WHERE google_subject = ?)))", subject);
        jdbcTemplate.update("DELETE FROM activity_sessions WHERE tag_id IN "
                + "(SELECT id FROM tags WHERE user_id IN "
                + "(SELECT id FROM users WHERE google_subject = ?))", subject);
        jdbcTemplate.update("DELETE FROM manual_time_entries WHERE tag_id IN "
                + "(SELECT id FROM tags WHERE user_id IN "
                + "(SELECT id FROM users WHERE google_subject = ?))", subject);
        jdbcTemplate.update("DELETE FROM tags WHERE user_id IN "
                + "(SELECT id FROM users WHERE google_subject = ?)", subject);
        jdbcTemplate.update("DELETE FROM users WHERE google_subject = ?", subject);
    }

    @Test
    void appliesMvpPhysicalSchema() {
        Integer tableCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() "
                        + "AND table_name IN ('users', 'tags', 'activity_sessions', 'session_segments', 'manual_time_entries')",
                Integer.class);
        Integer oldTimeLogCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() "
                        + "AND table_name = 'time_logs'",
                Integer.class);
        String userDeleteRule = jdbcTemplate.queryForObject(
                "SELECT delete_rule FROM information_schema.referential_constraints "
                        + "WHERE constraint_schema = DATABASE() AND table_name = 'tags' "
                        + "AND constraint_name = 'fk_tags_user'",
                String.class);

        org.junit.jupiter.api.Assertions.assertEquals(5, tableCount);
        org.junit.jupiter.api.Assertions.assertEquals(0, oldTimeLogCount);
        org.junit.jupiter.api.Assertions.assertEquals("RESTRICT", userDeleteRule);
    }

    @Test
    void supportsSessionLifecycleSwitchRestoreAndSummary() throws Exception {
        long tagId = createTag("Work");
        String startBody = "{"
                + "\"tagId\":" + tagId + ","
                + "\"activityDate\":\"2026-09-06\","
                + "\"initialSegmentType\":\"FOCUS\","
                + "\"segmentPlannedDurationSeconds\":1500"
                + "}";
        MvcResult start = mockMvc.perform(post("/api/activity-sessions/start")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(startBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.segments", hasSize(1)))
                .andReturn();
        long sessionId = json(start).get("id").longValue();

        mockMvc.perform(get("/api/activity-sessions/active").with(googleUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionId))
                .andExpect(jsonPath("$.active").value(true));

        mockMvc.perform(post("/api/activity-sessions/{id}/switch", sessionId)
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"segmentType\":\"BREAK\",\"plannedDurationSeconds\":300}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.segments", hasSize(2)))
                .andExpect(jsonPath("$.segments[0].segmentType").value("FOCUS"))
                .andExpect(jsonPath("$.segments[1].segmentType").value("BREAK"));

        mockMvc.perform(post("/api/activity-sessions/{id}/finish", sessionId).with(googleUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.segments[0].endedAt").isNotEmpty())
                .andExpect(jsonPath("$.segments[1].endedAt").isNotEmpty());

        mockMvc.perform(get("/api/summary")
                        .param("activityDate", "2026-09-06")
                        .with(googleUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activitySessions", hasSize(1)))
                .andExpect(jsonPath("$.activitySessions[0].tagId").value(tagId));
    }

    @Test
    void supportsAllTimedManualPatternsAndUntimedManualEntry() throws Exception {
        long tagId = createTag("Study");
        String[] requests = {
            "{\"tagId\":" + tagId + ",\"activityDate\":\"2026-09-06\",\"segmentType\":\"FOCUS\","
                    + "\"startedAt\":\"2026-09-06T10:00:00Z\",\"endedAt\":\"2026-09-06T10:30:00Z\"}",
            "{\"tagId\":" + tagId + ",\"activityDate\":\"2026-09-06\",\"segmentType\":\"BREAK\","
                    + "\"startedAt\":\"2026-09-06T11:00:00Z\",\"durationSeconds\":600}",
            "{\"tagId\":" + tagId + ",\"activityDate\":\"2026-09-06\",\"segmentType\":\"FOCUS\","
                    + "\"endedAt\":\"2026-09-06T12:30:00Z\",\"durationSeconds\":1800}"
        };
        for (String request : requests) {
            mockMvc.perform(post("/api/activity-sessions/manual")
                            .with(googleUser())
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(request))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.segments", hasSize(1)));
        }

        mockMvc.perform(post("/api/manual-time-entries")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"
                                + "\"tagId\":" + tagId + ","
                                + "\"activityDate\":\"2026-09-06\","
                                + "\"totalSeconds\":120,"
                                + "\"focusSeconds\":90,"
                                + "\"breakSeconds\":30"
                                + "}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.totalSeconds").value(120));

        mockMvc.perform(get("/api/summary")
                        .param("activityDate", "2026-09-06")
                        .with(googleUser()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.activitySessions", hasSize(3)))
                .andExpect(jsonPath("$.manualTimeEntries", hasSize(1)))
                .andExpect(jsonPath("$.totalSeconds").value(4320));
    }

    @Test
    void rejectsActiveSessionAndOverlappingSession() throws Exception {
        long tagId = createTag("Work");
        String today = LocalDate.now().toString();
        String activeRequest = "{\"tagId\":" + tagId
                + ",\"activityDate\":\"" + today + "\",\"initialSegmentType\":\"FOCUS\"}";
        long sessionId = json(mockMvc.perform(post("/api/activity-sessions/start")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activeRequest))
                .andExpect(status().isCreated())
                .andReturn()).get("id").longValue();

        mockMvc.perform(post("/api/activity-sessions/start")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(activeRequest))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/activity-sessions/{id}/finish", sessionId).with(googleUser()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/activity-sessions/manual")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"tagId\":" + tagId + ",\"activityDate\":\"" + today + "\","
                                + "\"segmentType\":\"FOCUS\",\"startedAt\":\"" + today + "T00:00:00Z\","
                                + "\"endedAt\":\"" + LocalDate.parse(today).plusDays(1) + "T00:00:00Z\"}"))
                .andExpect(status().isConflict());
    }

    @Test
    void enforcesOwnerChecksAndManualBreakdown() throws Exception {
        long tagId = createTag("Private");
        String invalidBreakdown = "{\"tagId\":" + tagId
                + ",\"activityDate\":\"2026-09-06\",\"totalSeconds\":10,\"focusSeconds\":4,\"breakSeconds\":5}";
        mockMvc.perform(post("/api/manual-time-entries")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBreakdown))
                .andExpect(status().isBadRequest());

        String otherSubject = "other-" + UUID.randomUUID();
        try {
            MvcResult otherUser = mockMvc.perform(get("/api/users/me").with(googleUser(otherSubject)))
                    .andExpect(status().isOk())
                    .andReturn();
            org.junit.jupiter.api.Assertions.assertNotNull(otherUser);
            mockMvc.perform(delete("/api/tags/{id}", tagId).with(googleUser(otherSubject)))
                    .andExpect(status().isNotFound());
        } finally {
            jdbcTemplate.update("DELETE FROM tags WHERE user_id IN "
                    + "(SELECT id FROM users WHERE google_subject = ?)", otherSubject);
            jdbcTemplate.update("DELETE FROM users WHERE google_subject = ?", otherSubject);
        }
    }

    private long createTag(String displayName) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/tags")
                        .with(googleUser())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"displayName\":\"" + displayName + "\"}"))
                .andExpect(status().isCreated())
                .andReturn();
        return json(result).get("id").longValue();
    }

    private JsonNode json(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString());
    }

    private RequestPostProcessor googleUser() {
        return googleUser(subject);
    }

    private RequestPostProcessor googleUser(String userSubject) {
        return request -> rawCsrf().postProcessRequest(
                googleAuthentication(userSubject).postProcessRequest(request));
    }

    private RequestPostProcessor rawCsrf() {
        return request -> {
            String csrfValue = UUID.randomUUID().toString();
            request.setCookies(new Cookie("XSRF-TOKEN", csrfValue));
            request.addHeader("X-XSRF-TOKEN", csrfValue);
            return request;
        };
    }

    private RequestPostProcessor googleAuthentication(String userSubject) {
        Map<String, Object> attributes = new HashMap<>();
        attributes.put("sub", userSubject);
        attributes.put("email", userSubject + "@example.com");
        attributes.put("name", "Integration User");
        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(
                new DefaultOAuth2User(
                        java.util.List.of(new SimpleGrantedAuthority("ROLE_USER")),
                        attributes,
                        "sub"),
                java.util.List.of(new SimpleGrantedAuthority("ROLE_USER")),
                "google");
        return SecurityMockMvcRequestPostProcessors.authentication(authentication);
    }
}
