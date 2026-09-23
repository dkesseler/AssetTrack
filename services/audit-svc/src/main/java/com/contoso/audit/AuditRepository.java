package com.contoso.audit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class AuditRepository {

    private final JdbcTemplate jdbc;

    public AuditRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public long insert(String actor, String action, String entityType, String entityId, String details) {
        jdbc.update(
                "INSERT INTO audit_events(event_time, actor, action, entity_type, entity_id, details) " +
                "VALUES(datetime('now'), ?, ?, ?, ?, ?)",
                actor, action, entityType, entityId, details);
        Long id = jdbc.queryForObject("SELECT last_insert_rowid()", Long.class);
        return id == null ? -1 : id;
    }

    public List<Map<String, Object>> recent(int limit) {
        return jdbc.queryForList(
                "SELECT id, event_time, actor, action, entity_type, entity_id, details " +
                "FROM audit_events ORDER BY id DESC LIMIT ?", limit);
    }

    // INTENTIONAL SQL INJECTION (course exercise target).
    // The query parameter is concatenated directly into the SQL.
    public List<Map<String, Object>> search(String query) {
        String sql = "SELECT id, event_time, actor, action, entity_type, entity_id, details " +
                     "FROM audit_events " +
                     "WHERE action LIKE '%" + query + "%' " +
                     "   OR entity_type LIKE '%" + query + "%' " +
                     "   OR details LIKE '%" + query + "%' " +
                     "ORDER BY id DESC";
        return jdbc.queryForList(sql);
    }
}
