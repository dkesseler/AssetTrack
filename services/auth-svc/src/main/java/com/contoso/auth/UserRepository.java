package com.contoso.auth;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public class UserRepository {

    private final JdbcTemplate jdbc;

    public UserRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    // INTENTIONAL SQL INJECTION (course exercise target).
    // The username is concatenated directly into the SQL string.
    public Map<String, Object> findByUsername(String username) {
        String sql = "SELECT id, username, password, display_name, role FROM users WHERE username = '" + username + "'";
        List<Map<String, Object>> rows = jdbc.queryForList(sql);
        return rows.isEmpty() ? null : rows.get(0);
    }

    public Map<String, Object> findById(long id) {
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT id, username, display_name, role FROM users WHERE id = ?", id);
        return rows.isEmpty() ? null : rows.get(0);
    }
}
