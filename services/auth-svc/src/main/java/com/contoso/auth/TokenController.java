package com.contoso.auth;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
public class TokenController {

    private final UserRepository users;
    private final JwtIssuer issuer;

    public TokenController(UserRepository users, JwtIssuer issuer) {
        this.users = users;
        this.issuer = issuer;
    }

    @GetMapping("/health")
    public Map<String, String> health() {
        Map<String, String> m = new HashMap<>();
        m.put("status", "ok");
        m.put("service", "auth-svc");
        return m;
    }

    @PostMapping("/token")
    public ResponseEntity<Map<String, Object>> token(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");
        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "username and password required"));
        }

        Map<String, Object> user = users.findByUsername(username);
        if (user == null || !password.equals(user.get("password"))) {
            return ResponseEntity.status(401).body(Map.of("error", "invalid credentials"));
        }

        String token = issuer.issue((String) user.get("username"), (String) user.get("role"));
        Map<String, Object> resp = new HashMap<>();
        resp.put("access_token", token);
        resp.put("token_type", "Bearer");
        resp.put("user", Map.of(
                "username", user.get("username"),
                "display_name", user.get("display_name"),
                "role", user.get("role")
        ));
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/.well-known/jwks")
    public Map<String, Object> jwks() {
        return issuer.jwks();
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> user(@PathVariable long id) {
        Map<String, Object> u = users.findById(id);
        return u == null ? ResponseEntity.notFound().build() : ResponseEntity.ok(u);
    }
}
