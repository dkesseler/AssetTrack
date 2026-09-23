package com.contoso.auth;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DataInit {

    @Bean
    public CommandLineRunner initSchemaAndSeed(JdbcTemplate jdbc) {
        return args -> {
            jdbc.execute("CREATE TABLE IF NOT EXISTS users (" +
                    " id INTEGER PRIMARY KEY AUTOINCREMENT," +
                    " username TEXT NOT NULL UNIQUE," +
                    // Legacy: plain-text passwords (DELIBERATELY BAD — course material).
                    " password TEXT NOT NULL," +
                    " display_name TEXT NOT NULL," +
                    " role TEXT NOT NULL" +
                    ")");

            Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM users", Integer.class);
            if (count != null && count == 0) {
                jdbc.update("INSERT INTO users(username,password,display_name,role) VALUES(?,?,?,?)",
                        "admin", "password", "Admin User", "admin");
                jdbc.update("INSERT INTO users(username,password,display_name,role) VALUES(?,?,?,?)",
                        "helpdesk", "password", "Helpdesk", "helpdesk");
                jdbc.update("INSERT INTO users(username,password,display_name,role) VALUES(?,?,?,?)",
                        "viewer", "password", "Read Only", "viewer");
            }
        };
    }
}
