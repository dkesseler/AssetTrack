package com.contoso.audit;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataInit {

    @Bean
    public CommandLineRunner initSchema(JdbcTemplate jdbc) {
        return args -> {
            jdbc.execute(
                "CREATE TABLE IF NOT EXISTS audit_events (" +
                "  id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "  event_time TEXT NOT NULL," +
                "  actor TEXT," +
                "  action TEXT NOT NULL," +
                "  entity_type TEXT NOT NULL," +
                "  entity_id TEXT NOT NULL," +
                "  details TEXT" +
                ")");

            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM audit_events", Integer.class);
            if (count != null && count == 0) {
                Object[][] rows = {
                    {"2024-09-01 09:14:02", "admin",    "create",     "asset",      "CON-LPT-001", "Initial provisioning"},
                    {"2024-09-02 10:02:11", "helpdesk", "assign",     "asset",      "CON-LPT-001", "Assigned to maya.patel"},
                    {"2024-09-05 08:47:32", "helpdesk", "assign",     "asset",      "CON-MON-001", "Dual-monitor request"},
                    {"2024-10-12 15:33:09", "admin",    "update",     "employee",   "8",           "Marked inactive (terminated)"},
                    {"2024-10-14 09:01:55", "helpdesk", "return",     "asset",      "CON-LPT-004", "Battery swelling — withdrawn"},
                    {"2024-10-14 09:02:44", "admin",    "status",     "asset",      "CON-LPT-004", "Status changed to retired"},
                    {"2024-11-20 11:18:27", "helpdesk", "lost",       "asset",      "CON-LPT-007", "Reported lost on travel"},
                    {"2024-12-03 13:55:08", "admin",    "login",      "user",       "admin",       "Successful login from 10.0.0.4"},
                    {"2024-12-03 14:07:41", "admin",    "delete",     "asset",      "CON-PHN-099", "Duplicate record removed"},
                    {"2025-01-08 16:22:00", "helpdesk", "assign",     "asset",      "CON-DCK-002", "WD19TBS dock for diego.hernandez"},
                    {"2025-02-19 08:30:15", "admin",    "permissions","user",       "viewer",      "Granted read-only role"},
                    {"2025-03-04 17:48:50", "helpdesk", "return",     "asset",      "CON-KBD-002", "Returned by hiroshi.tanaka"}
                };
                for (Object[] r : rows) {
                    jdbc.update(
                        "INSERT INTO audit_events(event_time, actor, action, entity_type, entity_id, details) " +
                        "VALUES(?, ?, ?, ?, ?, ?)",
                        r);
                }
            }
        };
    }
}
