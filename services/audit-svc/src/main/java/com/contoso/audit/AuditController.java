package com.contoso.audit;

import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
public class AuditController {

    private final AuditRepository repo;

    public AuditController(AuditRepository repo) {
        this.repo = repo;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> m = new HashMap<>();
        m.put("status", "ok");
        m.put("service", "audit-svc");
        return m;
    }

    @PostMapping("/events")
    public Map<String, Object> create(@RequestBody Map<String, String> body) {
        long id = repo.insert(
                body.get("actor"),
                body.getOrDefault("action", "unknown"),
                body.getOrDefault("entityType", "unknown"),
                body.getOrDefault("entityId", ""),
                body.get("details"));
        Map<String, Object> r = new HashMap<>();
        r.put("id", id);
        return r;
    }

    @GetMapping("/events")
    public List<Map<String, Object>> list(@RequestParam(name = "limit", defaultValue = "50") int limit,
                                          @RequestParam(name = "query", required = false) String query) {
        if (query != null && !query.isEmpty()) {
            return repo.search(query);
        }
        return repo.recent(limit);
    }
}
