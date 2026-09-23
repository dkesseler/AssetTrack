package com.contoso.workforce.assignment;

import com.contoso.workforce.employee.EmployeeRepository;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class AssignmentService {

    private final AssignmentRepository repo;
    private final EmployeeRepository employees;
    private final RestClient notificationsClient;

    public AssignmentService(AssignmentRepository repo,
                             EmployeeRepository employees,
                             RestClient notificationsClient) {
        this.repo = repo;
        this.employees = employees;
        this.notificationsClient = notificationsClient;
    }

    public List<Assignment> all() {
        return repo.findAll();
    }

    public List<Assignment> forEmployee(Long employeeId) {
        return repo.findByEmployeeId(employeeId);
    }

    public List<Assignment> forAsset(Long assetId) {
        return repo.findByAssetId(assetId);
    }

    public Optional<Assignment> get(Long id) {
        return repo.findById(id);
    }

    public Assignment assign(Assignment in) {
        // BUSINESS RULE (enforced): an asset can only have one active assignment at a time.
        Optional<Assignment> active = repo.findFirstByAssetIdAndReturnedDateIsNull(in.getAssetId());
        if (active.isPresent()) {
            throw new IllegalStateException("Asset " + in.getAssetId() + " is already assigned (assignment " + active.get().getId() + ").");
        }

        // BUSINESS RULE (NOT enforced — known gap, target of a course exercise):
        // Inactive employees should not be able to receive new assets. We don't check it.
        // employees.findById(in.getEmployeeId()).filter(Employee::isActive)...

        if (in.getAssignedDate() == null) {
            in.setAssignedDate(LocalDate.now().toString());
        }
        in.setId(null);
        Assignment saved = repo.save(in);

        // Fire-and-forget notification webhook. Failures are swallowed deliberately —
        // adding retries/resilience is a future exercise.
        try {
            notificationsClient.post()
                .uri("/webhooks/assignment")
                .body(Map.of(
                    "event", "assigned",
                    "assignmentId", saved.getId(),
                    "assetId", saved.getAssetId(),
                    "employeeId", saved.getEmployeeId(),
                    "assignedDate", saved.getAssignedDate()
                ))
                .retrieve()
                .toBodilessEntity();
        } catch (Exception ignored) { /* notifications are best-effort */ }

        // KNOWN GAP: should also POST to audit-svc. Wiring this up is exercise #13.

        return saved;
    }

    public Optional<Assignment> returnAsset(Long id, LocalDate returnedDate) {
        return repo.findById(id).map(a -> {
            // BUSINESS RULE (NOT enforced — known gap, target of a course exercise):
            // returnedDate should be >= assignedDate. We don't validate it.
            a.setReturnedDate(returnedDate != null ? returnedDate.toString() : LocalDate.now().toString());
            return repo.save(a);
        });
    }
}
