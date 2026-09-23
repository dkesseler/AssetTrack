package com.contoso.workforce.assignment;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/assignments")
public class AssignmentController {

    private final AssignmentService service;

    public AssignmentController(AssignmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Assignment> list(@RequestParam(required = false) Long employeeId,
                                 @RequestParam(required = false) Long assetId) {
        if (employeeId != null) return service.forEmployee(employeeId);
        if (assetId != null)    return service.forAsset(assetId);
        return service.all();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Assignment> get(@PathVariable Long id) {
        return service.get(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody Assignment in) {
        try {
            Assignment saved = service.assign(in);
            return ResponseEntity.status(201).body(saved);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/return")
    public ResponseEntity<Assignment> returnIt(@PathVariable Long id,
                                               @RequestBody(required = false) Map<String, String> body) {
        LocalDate when = (body != null && body.get("returnedDate") != null)
                ? LocalDate.parse(body.get("returnedDate"))
                : null;
        return service.returnAsset(id, when)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
}
