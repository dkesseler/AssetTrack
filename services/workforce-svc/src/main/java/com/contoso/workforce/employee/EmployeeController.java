package com.contoso.workforce.employee;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/employees")
public class EmployeeController {

    private final EmployeeRepository repo;

    public EmployeeController(EmployeeRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Employee> list(@RequestParam(required = false) String department,
                               @RequestParam(required = false) Boolean active) {
        if (department != null) return repo.findByDepartment(department);
        if (Boolean.TRUE.equals(active)) return repo.findByActiveTrue();
        return repo.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Employee> get(@PathVariable Long id) {
        return repo.findById(id).map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Employee create(@RequestBody Employee in) {
        in.setId(null);
        return repo.save(in);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Employee> update(@PathVariable Long id, @RequestBody Employee in) {
        return repo.findById(id).map(existing -> {
            existing.setFirstName(in.getFirstName());
            existing.setLastName(in.getLastName());
            existing.setEmail(in.getEmail());
            existing.setDepartment(in.getDepartment());
            existing.setTitle(in.getTitle());
            existing.setHireDate(in.getHireDate());
            existing.setActive(in.isActive());
            return ResponseEntity.ok(repo.save(existing));
        }).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repo.existsById(id)) return ResponseEntity.notFound().build();
        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
